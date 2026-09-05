import { db, pool } from '../src/database/db.js';
import { quotations, quotationApprovals, customers, priceLists, products } from '../src/database/schema/index.js';
import { eq } from 'drizzle-orm';

const API_BASE = 'http://localhost:5000/api/v1';

async function verifyEndToEndWorkflow() {
  console.log('================================================================');
  console.log('=== VERIFYING SALES REP SUBMISSION -> SALES MANAGER DASHBOARD ===');
  console.log('================================================================\n');

  // 1. Fetch reference customer, price list, and product from DB
  const [testCustomer] = await db.select().from(customers).where(eq(customers.status, 'ACTIVE')).limit(1);
  const [testPriceList] = await db.select().from(priceLists).where(eq(priceLists.isActive, true)).limit(1);
  const [testProduct] = await db.select().from(products).where(eq(products.isActive, true)).limit(1);

  if (!testCustomer || !testPriceList || !testProduct) {
    throw new Error('Missing active customer, price list, or product in database for testing.');
  }

  // 2. Sales Rep logs in
  console.log('1. Authenticating Sales Representative...');
  const repLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales.rep@dealflow360.io', password: 'Password@123' }),
  });
  const repAuth = await repLoginRes.json();
  const repToken = repAuth.data.accessToken;
  console.log(`   [Sales Rep Authenticated] User: ${repAuth.data.user.name} (${repAuth.data.user.email})`);

  // 3. Sales Rep creates and submits quotation with 18% discount (in 11%-20% Sales Manager approval range)
  console.log('\n2. Sales Representative submits quote with 18.00% discount via POST /api/v1/quotations...');
  const createQuoteRes = await fetch(`${API_BASE}/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${repToken}`,
    },
    body: JSON.stringify({
      customerId: testCustomer.id,
      priceListId: testPriceList.id,
      issueDate: '2026-09-06',
      expiryDate: '2026-10-06',
      notes: 'Strategic enterprise discount request for Q3 close',
      currency: 'INR',
      items: [
        {
          productId: testProduct.id,
          quantity: 2,
          discountPercent: '18.00',
        },
      ],
      submitForApproval: true,
      submitNotes: 'Please approve 18% discount for enterprise client',
    }),
  });

  const createQuoteData = await createQuoteRes.json();
  if (createQuoteRes.status !== 201) {
    throw new Error(`Failed to create quote: ${JSON.stringify(createQuoteData)}`);
  }
  const createdQuote = createQuoteData.data;
  console.log(`   Created Quotation: ${createdQuote.quotationNumber} (ID: ${createdQuote.id})`);
  console.log(`   Status: ${createdQuote.status}`);
  console.log(`   Total Amount: INR ${createdQuote.totalAmount}`);

  // 4. Sales Manager logs in
  console.log('\n3. Authenticating Sales Manager...');
  const mgrLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales.manager@dealflow360.io', password: 'Password@123' }),
  });
  const mgrAuth = await mgrLoginRes.json();
  const mgrToken = mgrAuth.data.accessToken;
  const mgrId = mgrAuth.data.user.userId;
  console.log(`   [Sales Manager Authenticated] User: ${mgrAuth.data.user.name} (${mgrAuth.data.user.email})`);

  // 5. Query the manager's pending approvals queue
  console.log('\n4. Fetching pending approvals queue via GET /api/v1/approvals/pending...');
  const queueRes = await fetch(`${API_BASE}/approvals/pending`, {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const queueData = await queueRes.json();
  const pendingItems = queueData.data || [];
  console.log(`   Found ${pendingItems.length} items in manager's approval queue.`);

  const foundItem = pendingItems.find((item: any) => item.quotationId === createdQuote.id);
  if (!foundItem) {
    throw new Error(`Quotation ${createdQuote.quotationNumber} was not found in the manager's pending approvals queue!`);
  }

  console.log(`   >> SUCCESS: Proposal reflected in Sales Manager approval queue!`);
  console.log(`      - Approval ID: ${foundItem.id}`);
  console.log(`      - Quotation: ${foundItem.quotation?.quotationNumber}`);
  console.log(`      - Customer: ${foundItem.quotation?.customer?.companyName}`);
  console.log(`      - Sales Rep: ${foundItem.quotation?.createdBy?.name}`);
  console.log(`      - Total Amount: ${foundItem.quotation?.totalAmount}`);
  console.log(`      - Discount: ${foundItem.quotation?.discountPercent}%`);

  // 6. Sales Manager clicks ACCEPT (Approve)
  console.log('\n5. Sales Manager clicking Accept/Approve via POST /api/v1/approvals/:id/approve...');
  const approveRes = await fetch(`${API_BASE}/approvals/${foundItem.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mgrToken}`,
    },
    body: JSON.stringify({ comments: 'Approved by Sales Manager: Meets enterprise volume criteria.' }),
  });
  const approveData = await approveRes.json();
  console.log(`   Response Status: ${approveRes.status}`);
  console.log(`   Approval Status: ${approveData.data?.approval?.status}`);
  console.log(`   Quotation Status: ${approveData.data?.quotationStatus}`);

  // 7. Verify directly in PostgreSQL
  console.log('\n6. Verifying database state in PostgreSQL...');
  const [dbApproval] = await db.select().from(quotationApprovals).where(eq(quotationApprovals.id, foundItem.id));
  const [dbQuote] = await db.select().from(quotations).where(eq(quotations.id, createdQuote.id));

  console.log(`   quotation_approvals.status: ${dbApproval.status}`);
  console.log(`   quotation_approvals.decided_by_id: ${dbApproval.decidedById}`);
  console.log(`   quotations.status: ${dbQuote.status}`);

  if (dbApproval.status !== 'APPROVED' || dbQuote.status !== 'APPROVED') {
    throw new Error('Approval or quotation status did not persist as APPROVED in PostgreSQL!');
  }

  // 8. Re-query queue to ensure it is cleared
  const queueAfterRes = await fetch(`${API_BASE}/approvals/pending`, {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const queueAfterData = await queueAfterRes.json();
  const stillThere = (queueAfterData.data || []).find((item: any) => item.quotationId === createdQuote.id);
  if (stillThere) {
    throw new Error('Approved quotation is still present in pending queue!');
  }
  console.log('   >> Confirmed: Approved quotation is immediately removed from pending queue.');

  console.log('\n================================================================');
  console.log('=== WORKFLOW VERIFIED END-TO-END WITH SUCCESS! ===');
  console.log('================================================================');
}

verifyEndToEndWorkflow()
  .catch((err) => {
    console.error('Workflow verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
