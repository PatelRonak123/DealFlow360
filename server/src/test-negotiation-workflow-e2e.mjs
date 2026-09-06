const BASE_URL = 'http://localhost:5000/api/v1';

async function login(email, password = 'Password@123') {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.data?.accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  return data.data.accessToken;
}

async function run() {
  console.log('=== DEALFLOW360: CUSTOMER NEGOTIATION & REVISION E2E TEST ===\n');

  // 1. Authenticate users
  console.log('[1] Logging in test actors...');
  const repToken = await login('sales.rep@dealflow360.io');
  const mgrToken = await login('sales.manager@dealflow360.io');
  const customerToken = await login('customer@dealflow360.io');
  console.log('✓ Actors authenticated: Sales Rep, Sales Manager, Customer\n');

  // 2. Fetch customer profile to get customerId
  const custProfileRes = await fetch(`${BASE_URL}/customer-portal/profile`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const custProfileData = await custProfileRes.json();
  const customerId = custProfileData.data?.id;
  console.log(`[2] Customer ID resolved: ${customerId} (${custProfileData.data?.companyName})`);

  // Fetch price lists and products for Rep to build a quotation
  const plRes = await fetch(`${BASE_URL}/price-lists`, {
    headers: { Authorization: `Bearer ${repToken}` },
  });
  const plData = await plRes.json();
  const priceListId = Array.isArray(plData.data) ? plData.data[0]?.id : plData.data?.items?.[0]?.id;

  const prodRes = await fetch(`${BASE_URL}/products?limit=2`, {
    headers: { Authorization: `Bearer ${repToken}` },
  });
  const prodData = await prodRes.json();
  const prods = Array.isArray(prodData.data) ? prodData.data : prodData.data?.items || [];
  if (!priceListId || prods.length === 0) {
    throw new Error('Required price list or products missing');
  }

  // 3. Sales Rep creates initial quotation V1
  console.log('\n[3] Sales Rep creates initial quotation V1...');
  const createQuoteRes = await fetch(`${BASE_URL}/quotations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${repToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      priceListId,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: 'Initial Proposal V1',
      items: [
        {
          productId: prods[0].id,
          quantity: 5,
          discountPercent: 5,
        },
      ],
    }),
  });
  const v1Created = (await createQuoteRes.json()).data;
  console.log(`✓ Quotation V1 created: ${v1Created.quotationNumber} (ID: ${v1Created.id})`);
  console.log(`  Version: ${v1Created.versionNumber}, isCustomerVisible: ${v1Created.isCustomerVisible}, Status: ${v1Created.status}`);

  // Submit V1 for approval
  const submitV1Res = await fetch(`${BASE_URL}/quotations/${v1Created.id}/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${repToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes: 'Submitting V1' }),
  });
  const v1Submitted = (await submitV1Res.json()).data;
  console.log(`✓ V1 submitted: status is ${v1Submitted.status}`);

  // If pending approval, Sales Manager approves V1 so it is approved & customer-visible
  if (v1Submitted.status.startsWith('PENDING')) {
    const pendingRes = await fetch(`${BASE_URL}/approvals/pending`, {
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    const pendingData = await pendingRes.json();
    const v1Approval = pendingData.data?.find((p) => p.quotationId === v1Created.id);
    if (v1Approval) {
      const approveRes = await fetch(`${BASE_URL}/approvals/${v1Approval.id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mgrToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments: 'Approved V1 proposal' }),
      });
      console.log(`✓ Manager approved V1: status code ${approveRes.status}`);
    }
  }

  // 4. Customer views V1 in Customer Portal
  console.log('\n[4] Customer views Quotation V1 in Customer Portal...');
  const custQuotationsRes = await fetch(`${BASE_URL}/customer-portal/quotations`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const custQuotations = (await custQuotationsRes.json()).data;
  const custV1 = custQuotations?.find((q) => q.id === v1Created.id);
  if (!custV1) {
    throw new Error(`Customer cannot view V1 (${v1Created.id}) in portal!`);
  }
  console.log(`✓ Customer successfully views V1: ${custV1.quotationNumber}, Status: ${custV1.status}, Version: ${custV1.versionNumber}`);

  // 5. Customer submits Negotiation Request 1 (asking for 25% discount)
  console.log('\n[5] Customer submits Negotiation Request (asking for 25% discount)...');
  const neg1Res = await fetch(`${BASE_URL}/customer-portal/quotations/${v1Created.id}/negotiate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestedDiscountPercent: 25,
      reason: 'Requesting volume discount for enterprise adoption',
      message: 'Can you provide 25% discount for our annual multi-seat expansion?',
    }),
  });
  const neg1Data = await neg1Res.json();
  if (!neg1Res.ok) {
    throw new Error(`Negotiation submission failed: ${JSON.stringify(neg1Data)}`);
  }
  console.log(`✓ Negotiation submitted! Status: ${neg1Data.data?.status}`);
  console.log(`  Quotation status is now: ${neg1Data.data?.status}`);

  // 6. Sales Rep lists negotiations and inspects
  console.log('\n[6] Sales Rep lists negotiations...');
  const repNegRes = await fetch(`${BASE_URL}/negotiations`, {
    headers: { Authorization: `Bearer ${repToken}` },
  });
  const repNegData = await repNegRes.json();
  const negItems = Array.isArray(repNegData.data) ? repNegData.data : repNegData.data?.items || [];
  const foundNeg = negItems.find((n) => n.quotationId === v1Created.id);
  if (!foundNeg) {
    throw new Error(`Sales Rep cannot find negotiation for quotation ${v1Created.id}`);
  }
  console.log(`✓ Sales Rep found negotiation: ID ${foundNeg.id}`);
  console.log(`  Customer: ${foundNeg.customerName || foundNeg.customer?.companyName}, Requested Discount: ${foundNeg.requestedDiscountPercent}%, Status: ${foundNeg.status}`);

  // 7. Test Decline Branch: Sales Rep declines 25% discount
  console.log('\n[7] Testing Alternative Branch: Sales Rep Declines Negotiation...');
  const declineRes = await fetch(`${BASE_URL}/negotiations/${foundNeg.id}/decline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${repToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      responseNote: 'Margins do not support 25% discount at this order tier. Proposal terms stand.',
    }),
  });
  const declineData = await declineRes.json();
  console.log(`✓ Sales Rep declined negotiation. Negotiation status: ${declineData.data?.status}`);

  // Verify Customer sees decline feedback, while V1 remains visible and valid
  const custV1AfterDeclineRes = await fetch(`${BASE_URL}/customer-portal/quotations/${v1Created.id}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const custV1AfterDecline = (await custV1AfterDeclineRes.json()).data;
  console.log(`✓ Customer checks V1: Status: ${custV1AfterDecline.status}`);
  console.log(`  Active negotiation status: ${custV1AfterDecline.activeNegotiation?.status}`);
  console.log(`  Rep decline response: "${custV1AfterDecline.activeNegotiation?.repResponse}"`);

  // 8. Customer submits Counter Negotiation 2 (asking for 12% discount)
  console.log('\n[8] Customer submits Counter Negotiation (12% compromise)...');
  const neg2Res = await fetch(`${BASE_URL}/customer-portal/quotations/${v1Created.id}/negotiate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestedDiscountPercent: 12,
      reason: 'Compromise counter-offer',
      message: 'Can we agree on 12% discount? We can sign immediately.',
    }),
  });
  const neg2Data = await neg2Res.json();
  const negsList2 = await (await fetch(`${BASE_URL}/negotiations`, {
    headers: { Authorization: `Bearer ${repToken}` },
  })).json();
  const negItems2 = Array.isArray(negsList2.data) ? negsList2.data : negsList2.data?.items || [];
  const neg2 = negItems2.find((n) => n.quotationId === v1Created.id && n.status === 'REQUESTED');
  if (!neg2) {
    throw new Error(`Cannot find counter negotiation 2 for quotation ${v1Created.id}`);
  }
  console.log(`✓ Counter Negotiation 2 created: ID ${neg2.id}, Requested: ${neg2.requestedDiscountPercent}%`);

  // 9. Sales Rep creates Revised Quotation V2 from Negotiation
  console.log('\n[9] Sales Rep accepts 12% discount & creates Revised Quotation V2...');
  const v1Detail = (await (await fetch(`${BASE_URL}/quotations/${v1Created.id}`, {
    headers: { Authorization: `Bearer ${repToken}` },
  })).json()).data;
  const v1ItemId = v1Detail.items[0].id;

  const createRevRes = await fetch(`${BASE_URL}/negotiations/${neg2.id}/create-revision`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${repToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      revisionReason: 'Agreed on 12% discount for immediate signing.',
      itemDiscounts: [
        {
          itemId: v1ItemId,
          discountPercent: 12,
        },
      ],
    }),
  });
  const v2Created = (await createRevRes.json()).data;
  console.log(`✓ Quotation V2 created: ${v2Created.quotationNumber} (ID: ${v2Created.id})`);
  console.log(`  parentQuotationId: ${v2Created.parentQuotationId} (matches V1: ${v2Created.parentQuotationId === v1Created.id})`);
  console.log(`  versionNumber: ${v2Created.versionNumber}`);
  console.log(`  isCustomerVisible: ${v2Created.isCustomerVisible} (CRITICAL: MUST BE FALSE)`);

  if (v2Created.isCustomerVisible !== false) {
    throw new Error('VIOLATION: Unapproved revision V2 must NOT be customer-visible!');
  }

  // 10. CRITICAL ISOLATION CHECK: Customer MUST NOT see V2 while in draft/approval
  console.log('\n[10] Verifying Customer Portal Isolation (V2 must be invisible to Customer)...');
  const custQuotesWhileV2Unapproved = (await (await fetch(`${BASE_URL}/customer-portal/quotations`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  })).json()).data;
  const customerSeesV2 = custQuotesWhileV2Unapproved?.some((q) => q.id === v2Created.id);
  console.log(`  Customer sees V2 in list? ${customerSeesV2} (Expected: false)`);
  if (customerSeesV2) {
    throw new Error('SECURITY LEAK: Customer should NOT see unapproved V2 in list!');
  }

  const custV2DirectFetch = await fetch(`${BASE_URL}/customer-portal/quotations/${v2Created.id}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  console.log(`  Customer direct fetch of V2 HTTP status: ${custV2DirectFetch.status} (Expected: 404)`);
  if (custV2DirectFetch.status !== 404) {
    throw new Error(`SECURITY LEAK: Customer direct fetch should return 404, got ${custV2DirectFetch.status}`);
  }
  console.log('✓ Customer Isolation Verified: Unapproved V2 is completely invisible to customer!');

  // 11. Submit V2 for Approval
  console.log('\n[11] Submitting V2 into Approval Governance...');
  const submitV2Res = await fetch(`${BASE_URL}/quotations/${v2Created.id}/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${repToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notes: 'Submitting V2 with negotiated 12% discount' }),
  });
  const submitV2Data = await submitV2Res.json();
  console.log(`✓ V2 submitted. Status: ${submitV2Data.data?.status}`);

  // 12. Sales Manager views Pending Approvals Queue
  console.log('\n[12] Sales Manager views Approvals Queue...');
  const mgrPendingRes = await fetch(`${BASE_URL}/approvals/pending`, {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const mgrPendingList = (await mgrPendingRes.json()).data;
  const v2Approval = mgrPendingList?.find((p) => p.quotationId === v2Created.id);
  if (!v2Approval) {
    throw new Error(`Manager cannot find V2 in pending approvals!`);
  }
  console.log(`✓ Manager found V2 in approvals queue: Approval ID ${v2Approval.id}`);
  console.log(`  Quotation Version: ${v2Approval.quotation?.versionNumber}`);
  console.log(`  Parent Quotation: ${v2Approval.quotation?.parentQuotation?.quotationNumber}`);
  console.log(`  Customer Negotiation Note: "${v2Approval.quotation?.negotiation?.customerMessage}"`);

  // 13. Sales Manager Approves V2 -> Atomic Visibility Switch
  console.log('\n[13] Sales Manager Approves V2 (triggering atomic visibility swap)...');
  const approveV2Res = await fetch(`${BASE_URL}/approvals/${v2Approval.id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mgrToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comments: 'Approved 12% negotiated terms for V2' }),
  });
  console.log(`✓ Manager approved V2: HTTP ${approveV2Res.status}`);

  // 14. Customer Portal Visibility Switch Verification
  console.log('\n[14] Verifying Customer Portal Visibility Switch...');
  const custQuotesAfterApproval = (await (await fetch(`${BASE_URL}/customer-portal/quotations`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  })).json()).data;

  const customerSeesV1Now = custQuotesAfterApproval?.some((q) => q.id === v1Created.id);
  const customerSeesV2Now = custQuotesAfterApproval?.find((q) => q.id === v2Created.id);

  console.log(`  Customer sees old V1 in list? ${customerSeesV1Now} (Expected: false)`);
  console.log(`  Customer sees approved V2 in list? ${!!customerSeesV2Now} (Expected: true)`);

  if (customerSeesV1Now) {
    throw new Error('STATE ERROR: V1 should no longer be visible after V2 approval!');
  }
  if (!customerSeesV2Now) {
    throw new Error('STATE ERROR: Approved V2 should now be visible to Customer!');
  }
  console.log(`✓ Visible Quote is now V2: ${customerSeesV2Now.quotationNumber}, Version: ${customerSeesV2Now.versionNumber}, Status: ${customerSeesV2Now.status}`);

  // 15. Customer Confirms Order on Approved V2
  console.log('\n[15] Customer confirms Order on Approved Revised Quotation V2...');
  const confirmRes = await fetch(`${BASE_URL}/customer-portal/quotations/${v2Created.id}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${customerToken}`,
      'Content-Type': 'application/json',
    },
  });
  const confirmData = await confirmRes.json();
  if (!confirmRes.ok) {
    throw new Error(`Order confirmation failed: ${JSON.stringify(confirmData)}`);
  }
  console.log(`✓ Order Confirmed! Sales Order Created: ${confirmData.data?.order?.orderNumber}`);
  console.log(`  Order Total: ₹${confirmData.data?.order?.totalAmount}`);

  console.log('\n======================================================');
  console.log('🎉 ALL 7 TEST STAGES PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
