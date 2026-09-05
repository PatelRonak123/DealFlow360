import { db, pool } from "../src/database/db.js";
import { quotations, quotationApprovals, customers, priceLists, products } from "../src/database/schema/index.js";
import { eq } from "drizzle-orm";

const API_BASE = "http://localhost:5000/api/v1";

async function testRejectWorkflow() {
  console.log("=== Testing Reject Workflow ===");

  const [testCustomer] = await db.select().from(customers).limit(1);
  const [testPriceList] = await db.select().from(priceLists).limit(1);
  const [testProduct] = await db.select().from(products).limit(1);

  // 1. Sales Rep logs in and creates quote with 19% discount
  const repLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sales.rep@dealflow360.io", password: "Password@123" }),
  });
  const repToken = (await repLoginRes.json()).data.accessToken;

  const quoteCreateRes = await fetch(`${API_BASE}/quotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${repToken}` },
    body: JSON.stringify({
      customerId: testCustomer.id,
      priceListId: testPriceList.id,
      issueDate: "2026-09-05",
      expiryDate: "2026-10-05",
      notes: "Deal to be rejected for high discount",
    }),
  });
  const quoteId = (await quoteCreateRes.json()).data.id;

  await fetch(`${API_BASE}/quotations/${quoteId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${repToken}` },
    body: JSON.stringify({ productId: testProduct.id, quantity: 2, discountPercent: "19.00" }),
  });

  const submitRes = await fetch(`${API_BASE}/quotations/${quoteId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${repToken}` },
    body: JSON.stringify({ notes: "Please approve 19% discount" }),
  });
  const submitData = (await submitRes.json()).data;
  const approvalId = submitData.approvals[0].id;
  console.log(`Created Quote ${submitData.quotationNumber} with Approval ID ${approvalId}`);

  // 2. Sales Manager logs in and rejects
  const mgrLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "sales.manager@dealflow360.io", password: "Password@123" }),
  });
  const mgrAuth = (await mgrLoginRes.json()).data;
  const mgrToken = mgrAuth.accessToken;
  const mgrId = mgrAuth.user.userId;

  const rejectionReason = "Discount exceeds target quarterly margins for this product tier. Maximum allowable is 12%.";
  const rejectRes = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${mgrToken}` },
    body: JSON.stringify({ comments: rejectionReason }),
  });

  const rejectData = (await rejectRes.json()).data;
  console.log("Reject Response Status:", rejectRes.status);
  console.log("Approval Status:", rejectData.approval.status);
  console.log("Quotation Status:", rejectData.quotationStatus);
  console.log("Decided By ID:", rejectData.approval.decidedById);
  console.log("Comments:", rejectData.approval.comments);

  // 3. Directly verify PostgreSQL state
  const [dbApproval] = await db.select().from(quotationApprovals).where(eq(quotationApprovals.id, approvalId));
  const [dbQuotation] = await db.select().from(quotations).where(eq(quotations.id, quoteId));

  if (dbApproval.status !== "REJECTED" || dbQuotation.status !== "REJECTED") {
    throw new Error("Rejection state was not persisted correctly in PostgreSQL!");
  }
  if (dbApproval.decidedById !== mgrId) {
    throw new Error("Decided by ID does not match manager ID!");
  }
  if (dbApproval.comments !== rejectionReason) {
    throw new Error("Rejection comments do not match!");
  }

  console.log(">> REJECT WORKFLOW VERIFIED SUCCESSFULLY IN POSTGRESQL!");
}

testRejectWorkflow()
  .catch((err) => {
    console.error("Reject test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
