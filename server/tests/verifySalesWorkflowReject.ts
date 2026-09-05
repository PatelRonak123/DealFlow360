import { db, pool } from '../src/database/db.js';
import { quotations, quotationApprovals, customers, priceLists, products } from '../src/database/schema/index.js';
import { eq } from 'drizzle-orm';

const API_BASE = 'http://localhost:5000/api/v1';

async function verifyRejectWorkflow() {
  console.log('=== VERIFYING SALES REP SUBMISSION -> SALES MANAGER REJECT ===');

  const [testCustomer] = await db.select().from(customers).where(eq(customers.status, 'ACTIVE')).limit(1);
  const [testPriceList] = await db.select().from(priceLists).where(eq(priceLists.isActive, true)).limit(1);
  const [testProduct] = await db.select().from(products).where(eq(products.isActive, true)).limit(1);

  // 1. Sales Rep logs in
  const repLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales.rep@dealflow360.io', password: 'Password@123' }),
  });
  const repToken = (await repLoginRes.json()).data.accessToken;

  // 2. Rep creates quote with 19% discount
  const createQuoteRes = await fetch(`${API_BASE}/quotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${repToken}` },
    body: JSON.stringify({
      customerId: testCustomer.id,
      priceListId: testPriceList.id,
      issueDate: '2026-09-06',
      expiryDate: '2026-10-06',
      notes: 'Deal requesting 19% discount',
      currency: 'INR',
      items: [{ productId: testProduct.id, quantity: 1, discountPercent: '19.00' }],
      submitForApproval: true,
      submitNotes: 'Requesting 19% manager approval',
    }),
  });
  const createdQuote = (await createQuoteRes.json()).data;
  console.log(`Created Quote: ${createdQuote.quotationNumber} (${createdQuote.id})`);

  // 3. Manager logs in
  const mgrLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales.manager@dealflow360.io', password: 'Password@123' }),
  });
  const mgrToken = (await mgrLoginRes.json()).data.accessToken;

  // 4. Fetch pending queue
  const queueRes = await fetch(`${API_BASE}/approvals/pending`, {
    headers: { Authorization: `Bearer ${mgrToken}` },
  });
  const pendingItems = (await queueRes.json()).data || [];
  const found = pendingItems.find((i: any) => i.quotationId === createdQuote.id);
  if (!found) throw new Error('Quote not in manager queue!');

  // 5. Manager clicks Reject
  const rejectRes = await fetch(`${API_BASE}/approvals/${found.id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
    body: JSON.stringify({ comments: 'Discount too high for single unit order. Max allowed is 10%.' }),
  });
  console.log(`Reject Response Status: ${rejectRes.status}`);

  // 6. Verify in DB
  const [dbApproval] = await db.select().from(quotationApprovals).where(eq(quotationApprovals.id, found.id));
  const [dbQuote] = await db.select().from(quotations).where(eq(quotations.id, createdQuote.id));

  if (dbApproval.status !== 'REJECTED' || dbQuote.status !== 'REJECTED') {
    throw new Error('Statuses not REJECTED in PostgreSQL!');
  }
  console.log(`>> Successfully verified rejection persisted in PostgreSQL! (Status: ${dbQuote.status})`);
}

verifyRejectWorkflow()
  .catch((err) => {
    console.error('Reject verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
