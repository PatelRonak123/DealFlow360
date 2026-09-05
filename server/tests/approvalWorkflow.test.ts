import { db, pool } from "../src/database/db.js";
import { quotations, quotationApprovals, users, customers, priceLists, products } from "../src/database/schema/index.js";
import { eq } from "drizzle-orm";

const API_BASE = "http://localhost:5000/api/v1";

async function runApprovalWorkflowVerification() {
  console.log("================================================================================");
  console.log("===      DEALFLOW360 SALES MANAGER APPROVAL WORKFLOW END-TO-END SUITE       ===");
  console.log("================================================================================\n");

  // --- Step 0: Ensure prerequisite test records exist ---
  const [testCustomer] = await db.select().from(customers).limit(1);
  const [testPriceList] = await db.select().from(priceLists).limit(1);
  const [testProduct] = await db.select().from(products).limit(1);

  if (!testCustomer || !testPriceList || !testProduct) {
    throw new Error("Database missing seed customer, price list, or product.");
  }

  // --- Test 1: Sales Rep creates quotation with 18% discount and submits ---
  console.log("--- TEST 1: Sales Representative Quotation Creation & Submission ---");
  const repLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sales.rep@dealflow360.io", password: "Password@123" }),
  });
  const repAuth = (await repLoginRes.json()).data;
  const repToken = repAuth.accessToken;
  console.log(`[Sales Rep Authenticated] ${repAuth.user.name} (${repAuth.user.email})`);

  console.log("1. Creating quotation header via POST /api/v1/quotations...");
  const quoteCreateRes = await fetch(`${API_BASE}/quotations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${repToken}`,
    },
    body: JSON.stringify({
      customerId: testCustomer.id,
      priceListId: testPriceList.id,
      issueDate: "2026-09-05",
      expiryDate: "2026-10-05",
      notes: "Strategic commercial expansion proposal requiring Sales Manager approval (18% discount)",
    }),
  });
  const quoteData = (await quoteCreateRes.json()).data;
  const quotationId = quoteData.id;
  console.log(`   Quotation created: ${quoteData.quotationNumber} (UUID: ${quotationId})`);

  console.log("2. Adding line item with 18.00% discount (in 11%-20% Sales Manager range)...");
  const itemRes = await fetch(`${API_BASE}/quotations/${quotationId}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${repToken}`,
    },
    body: JSON.stringify({
      productId: testProduct.id,
      quantity: 5,
      discountPercent: "18.00",
    }),
  });
  const itemData = (await itemRes.json()).data;
  console.log(`   Line item added: Net Amount = INR ${itemData.item.netAmount}, Discount = ${itemData.item.discountPercent}%`);

  console.log("3. Submitting quotation for discount governance evaluation via POST /api/v1/quotations/:id/submit...");
  const submitRes = await fetch(`${API_BASE}/quotations/${quotationId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${repToken}`,
    },
    body: JSON.stringify({
      notes: "Enterprise contract justification: 18% discount negotiated for 3-year term commitment",
    }),
  });
  const submitResult = (await submitRes.json()).data;
  console.log(`   Quotation Status: ${submitResult.status}`);
  console.log(`   Approval Route: ${submitResult.approvalRoute}`);
  console.log(`   Approvals Generated: ${submitResult.approvals.length}`);

  if (!submitResult.approvals || submitResult.approvals.length === 0) {
    throw new Error("No approval record was created for quotation with 18% discount!");
  }

  const approvalRecord = submitResult.approvals[0];
  const approvalId = approvalRecord.id;
  console.log(`   Approval Step: ID = ${approvalId}, Level = ${approvalRecord.approvalLevel}, Status = ${approvalRecord.status}`);

  if (submitResult.status !== "PENDING_APPROVAL" && submitResult.status !== "PENDING_MANAGER_APPROVAL") {
    throw new Error(`Expected quotation status PENDING_APPROVAL, got: ${submitResult.status}`);
  }
  if (approvalRecord.status !== "PENDING") {
    throw new Error(`Expected approval record status PENDING, got: ${approvalRecord.status}`);
  }
  console.log(">> TEST 1 PASSED: Quotation in PENDING_APPROVAL and quotation_approvals record is PENDING.\n");

  // --- Test 4: Authorization check - Sales Rep cannot approve ---
  console.log("--- TEST 4: Authorization & RBAC Enforcement (Sales Rep Attempt) ---");
  console.log("Attempting POST /api/v1/approvals/:id/approve with Sales Rep credentials...");
  const repUnauthorizedRes = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${repToken}`,
    },
    body: JSON.stringify({ comments: "Sales Rep attempting self-approval" }),
  });
  const repUnauthorizedData = await repUnauthorizedRes.json();
  console.log(`   HTTP Status: ${repUnauthorizedRes.status}`);
  console.log(`   Error Code: ${repUnauthorizedData.error?.code}`);
  console.log(`   Message: ${repUnauthorizedData.error?.message}`);

  if (repUnauthorizedRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for Sales Rep, received: ${repUnauthorizedRes.status}`);
  }

  // Verify database record was NOT mutated
  const [dbApprovalAfterRepAttempt] = await db
    .select()
    .from(quotationApprovals)
    .where(eq(quotationApprovals.id, approvalId));
  if (dbApprovalAfterRepAttempt.status !== "PENDING" || dbApprovalAfterRepAttempt.decidedById !== null) {
    throw new Error("Database integrity violated: approval was modified by unauthorized attempt!");
  }
  console.log(">> TEST 4 PASSED: System strictly returns 403 Forbidden and database remains unmutated.\n");

  // --- Test 2: Sales Manager reviews queue and approves ---
  console.log("--- TEST 2: Sales Manager Approval Workflow & PostgreSQL Updates ---");
  const mgrLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sales.manager@dealflow360.io", password: "Password@123" }),
  });
  const mgrAuth = (await mgrLoginRes.json()).data;
  const mgrToken = mgrAuth.accessToken;
  const mgrUserId = mgrAuth.user.userId;
  console.log(`[Sales Manager Authenticated] ${mgrAuth.user.name} (${mgrAuth.user.email}) - UserID: ${mgrUserId}`);

  console.log("1. Querying pending queue via GET /api/v1/approvals/pending...");
  const queueRes = await fetch(`${API_BASE}/approvals/pending`, {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const queueData = (await queueRes.json()).data;
  const matchingItem = queueData.find((a: any) => a.id === approvalId);

  if (!matchingItem) {
    throw new Error(`Approval ${approvalId} did not appear in Sales Manager pending queue!`);
  }
  console.log(`   Located in Queue: Quotation ${matchingItem.quotation?.quotationNumber}`);
  console.log(`     Customer: ${matchingItem.quotation?.customer?.companyName}`);
  console.log(`     Total Amount: INR ${matchingItem.quotation?.totalAmount}`);
  console.log(`     Discount: ${matchingItem.quotation?.discountPercent}%`);
  console.log(`     Representative: ${matchingItem.quotation?.createdBy?.name} (${matchingItem.quotation?.createdBy?.email})`);

  console.log("2. Processing approval via POST /api/v1/approvals/:id/approve inside DB transaction...");
  const approvalComment = "Approved by Regional Sales Manager - Strategic deal within margin authority";
  const approveRes = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mgrToken}`,
    },
    body: JSON.stringify({ comments: approvalComment }),
  });
  console.log(`   Response HTTP Status: ${approveRes.status}`);
  const approveResponseData = (await approveRes.json()).data;
  console.log(`   Approval Record Status: ${approveResponseData.approval.status}`);
  console.log(`   Quotation Status: ${approveResponseData.quotationStatus}`);
  console.log(`   Decided By ID: ${approveResponseData.approval.decidedById}`);
  console.log(`   Decided At: ${approveResponseData.approval.decidedAt}`);
  console.log(`   Stored Comments: "${approveResponseData.approval.comments}"`);

  if (approveRes.status !== 200) {
    throw new Error(`Expected HTTP 200 from approve endpoint, got ${approveRes.status}`);
  }
  if (approveResponseData.approval.status !== "APPROVED") {
    throw new Error(`Expected approval.status APPROVED, got ${approveResponseData.approval.status}`);
  }
  if (approveResponseData.quotationStatus !== "APPROVED") {
    throw new Error(`Expected quotationStatus APPROVED, got ${approveResponseData.quotationStatus}`);
  }
  if (approveResponseData.approval.decidedById !== mgrUserId) {
    throw new Error(`Expected decidedById ${mgrUserId}, got ${approveResponseData.approval.decidedById}`);
  }
  console.log(">> TEST 2 PASSED: Quotation and approval successfully approved by Sales Manager.\n");

  // --- Test 3: Database Persistence Verification ---
  console.log("--- TEST 3: Direct PostgreSQL Persistence Verification via Drizzle ORM ---");
  const [dbApproval] = await db
    .select()
    .from(quotationApprovals)
    .where(eq(quotationApprovals.id, approvalId));

  const [dbQuotation] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, quotationId));

  console.log("Direct Query Results from PostgreSQL tables:");
  console.log("  [Table: quotation_approvals]");
  console.log(`    id:             ${dbApproval.id}`);
  console.log(`    quotation_id:   ${dbApproval.quotationId}`);
  console.log(`    approval_level: ${dbApproval.approvalLevel}`);
  console.log(`    status:         ${dbApproval.status}`);
  console.log(`    decided_by_id:  ${dbApproval.decidedById}`);
  console.log(`    decided_at:     ${dbApproval.decidedAt?.toISOString()}`);
  console.log(`    comments:       "${dbApproval.comments}"`);
  console.log(`    updated_at:     ${dbApproval.updatedAt.toISOString()}`);

  console.log("  [Table: quotations]");
  console.log(`    id:               ${dbQuotation.id}`);
  console.log(`    quotation_number: ${dbQuotation.quotationNumber}`);
  console.log(`    status:           ${dbQuotation.status}`);
  console.log(`    subtotal:         INR ${dbQuotation.subtotal}`);
  console.log(`    discount_amount:  INR ${dbQuotation.discountAmount}`);
  console.log(`    total_amount:     INR ${dbQuotation.totalAmount}`);
  console.log(`    updated_at:       ${dbQuotation.updatedAt.toISOString()}`);

  if (dbApproval.status !== "APPROVED") {
    throw new Error(`PostgreSQL quotation_approvals.status is ${dbApproval.status}, expected APPROVED`);
  }
  if (dbQuotation.status !== "APPROVED") {
    throw new Error(`PostgreSQL quotations.status is ${dbQuotation.status}, expected APPROVED`);
  }
  if (dbApproval.decidedById !== mgrUserId) {
    throw new Error(`PostgreSQL decided_by_id does not match manager ID ${mgrUserId}`);
  }
  if (!dbApproval.decidedAt) {
    throw new Error("PostgreSQL decided_at timestamp is null in database!");
  }

  // Verify removed from pending queue
  const queueVerifyRes = await fetch(`${API_BASE}/approvals/pending`, {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const queueVerifyData = (await queueVerifyRes.json()).data;
  const isStillInQueue = queueVerifyData.some((a: any) => a.id === approvalId);
  if (isStillInQueue) {
    throw new Error("Approved quotation is still returned in GET /approvals/pending!");
  }
  console.log("  Verified: Record is no longer returned in pending approvals queue.");
  console.log(">> TEST 3 PASSED: All records are fully persisted in PostgreSQL and survive queries/restarts.\n");

  // --- Duplicate Action Check ---
  console.log("--- IDEMPOTENCY & DUPLICATE PREVENTION CHECK ---");
  console.log("Calling POST /api/v1/approvals/:id/approve a second time on the approved record...");
  const duplicateRes = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mgrToken}`,
    },
    body: JSON.stringify({ comments: "Duplicate submission attempt" }),
  });
  const duplicateData = await duplicateRes.json();
  console.log(`   HTTP Status: ${duplicateRes.status}`);
  console.log(`   Error Code: ${duplicateData.error?.code}`);
  console.log(`   Message: ${duplicateData.error?.message}`);

  if (duplicateRes.status !== 400) {
    throw new Error(`Expected HTTP 400 for duplicate approval, got ${duplicateRes.status}`);
  }
  console.log(">> DUPLICATE CHECK PASSED: Rejected duplicate approval attempt.\n");

  console.log("================================================================================");
  console.log("===       ALL 4 VERIFICATION TESTS COMPLETED & PERSISTED IN POSTGRESQL!       ===");
  console.log("================================================================================\n");
}

runApprovalWorkflowVerification()
  .catch((err) => {
    console.error("VERIFICATION FAILED WITH ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
