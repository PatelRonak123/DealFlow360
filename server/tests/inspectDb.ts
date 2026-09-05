import { db, pool } from '../src/database/db.js';
import { quotations, quotationApprovals, users, customers, quotationItems } from '../src/database/schema/index.js';

async function run() {
  const q = await db.select().from(quotations);
  const a = await db.select().from(quotationApprovals);
  const u = await db.select().from(users);
  const c = await db.select().from(customers);
  const items = await db.select().from(quotationItems);
  
  console.log(JSON.stringify({
    counts: {
      quotations: q.length,
      approvals: a.length,
      users: u.length,
      customers: c.length,
      quotationItems: items.length
    },
    quotationsSummary: q.map(item => ({
      number: item.quotationNumber,
      status: item.status,
      total: item.totalAmount,
      subtotal: item.subtotal,
      discount: item.discountAmount,
      createdBy: item.createdBy
    })),
    users: u.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email
    }))
  }, null, 2));

  await pool.end();
}

run().catch(console.error);
