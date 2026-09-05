import { db } from '../src/database/db.js';
import {
  users,
  customerTiers,
  productCategories,
  products,
  customers,
  priceLists,
  priceListItems,
  customerTierDiscountRules,
  categoryDiscountRules,
  quotationApprovals,
} from '../src/database/schema/index.js';
import { eq } from 'drizzle-orm';
import { quotationsService } from '../src/modules/quotations/services/quotations.service.js';
import { DiscountEvaluationService } from '../src/modules/discount-governance/services/discountEvaluation.service.js';
import { ApprovalRoutingService } from '../src/modules/discount-governance/services/approvalRouting.service.js';
import { RiskCalculationService } from '../src/modules/discount-governance/services/riskCalculation.service.js';
import { QuotationStatuses } from '../src/modules/quotations/constants/quotationStatus.js';
import { ApprovalLevels } from '../src/modules/discount-governance/constants/approvalLevels.js';
import { ApprovalStatuses } from '../src/modules/discount-governance/constants/approvalStatus.js';
import { Roles } from '../src/modules/rbac/constants/roles.js';
import { AuthUserContext } from '../src/modules/rbac/types/index.js';

async function runPhase6Tests() {
  console.log('=== Starting Phase 6 Automated Verification Suite ===\n');

  // Contexts
  const salesRepUser: AuthUserContext = {
    userId: '11111111-1111-1111-1111-111111111111',
    name: 'Sales Rep Alice',
    email: 'rep.alice@dealflow360.com',
    roles: [Roles.SALES_REP],
    permissions: [],
  };

  const salesManagerUser: AuthUserContext = {
    userId: '22222222-2222-2222-2222-222222222222',
    name: 'Manager Bob',
    email: 'manager.bob@dealflow360.com',
    roles: [Roles.SALES_MANAGER],
    permissions: [],
  };

  const financeUser: AuthUserContext = {
    userId: '33333333-3333-3333-3333-333333333333',
    name: 'Finance Carol',
    email: 'finance.carol@dealflow360.com',
    roles: [Roles.FINANCE_OPERATIONS],
    permissions: [],
  };

  const adminUser: AuthUserContext = {
    userId: '44444444-4444-4444-4444-444444444444',
    name: 'Admin Super',
    email: 'admin.super@dealflow360.com',
    roles: [Roles.ADMIN],
    permissions: [],
  };

  // 1. Setup Mock Users in DB
  console.log('[Test 0] Setting up mock users...');
  for (const u of [salesRepUser, salesManagerUser, financeUser, adminUser]) {
    const existing = await db.query.users.findFirst({ where: eq(users.id, u.userId) });
    if (!existing) {
      await db.insert(users).values({
        id: u.userId,
        name: u.name,
        email: u.email,
        passwordHash: 'dummy-hash',
        isActive: true,
      });
    }
  }

  // 2. Setup Master Data, Price Lists, and Discount Rules
  console.log('[Test 1] Setting up Master Data, Categories, and Discount Rules...');
  const timestamp = Date.now();

  const [tierGold] = await db
    .insert(customerTiers)
    .values({
      name: `Gold Tier ${timestamp}`,
      description: 'Gold level corporate accounts',
      isActive: true,
    })
    .returning();

  // Tier Discount Rule: 15%
  await db.insert(customerTierDiscountRules).values({
    customerTierId: tierGold.id,
    maxDiscountPercent: '15.00',
    isActive: true,
  });

  const [customerA] = await db
    .insert(customers)
    .values({
      companyName: `Global Tech ${timestamp}`,
      contactName: 'David Lee',
      email: `david.${timestamp}@globaltech.com`,
      customerTierId: tierGold.id,
      status: 'ACTIVE',
    })
    .returning();

  // Category 1: Hardware Appliances (Limit: 10%)
  const [catHardware] = await db
    .insert(productCategories)
    .values({
      name: `Hardware Appliances ${timestamp}`,
      description: 'Physical server units',
      isActive: true,
    })
    .returning();

  await db.insert(categoryDiscountRules).values({
    categoryId: catHardware.id,
    maxDiscountPercent: '10.00',
    isActive: true,
  });

  // Category 2: Cloud Software (Limit: 20%)
  const [catSoftware] = await db
    .insert(productCategories)
    .values({
      name: `Cloud Software ${timestamp}`,
      description: 'SaaS recurring licenses',
      isActive: true,
    })
    .returning();

  await db.insert(categoryDiscountRules).values({
    categoryId: catSoftware.id,
    maxDiscountPercent: '20.00',
    isActive: true,
  });

  // Products
  const [prodServer] = await db
    .insert(products)
    .values({
      name: 'Enterprise Rack Server',
      sku: `SKU-SRV-${timestamp}`,
      categoryId: catHardware.id,
      productType: 'ONE_TIME',
      basePrice: '100000.00',
      currency: 'INR',
      isActive: true,
    })
    .returning();

  const [prodCloud] = await db
    .insert(products)
    .values({
      name: 'Cloud Suite License',
      sku: `SKU-CLD-${timestamp}`,
      categoryId: catSoftware.id,
      productType: 'RECURRING',
      basePrice: '50000.00',
      currency: 'INR',
      isActive: true,
    })
    .returning();

  // Price List
  const [standardPriceList] = await db
    .insert(priceLists)
    .values({
      name: `Standard Commercial Price List ${timestamp}`,
      currency: 'INR',
      isDefault: true,
      isActive: true,
    })
    .returning();

  await db.insert(priceListItems).values([
    {
      priceListId: standardPriceList.id,
      productId: prodServer.id,
      price: '100000.00',
    },
    {
      priceListId: standardPriceList.id,
      productId: prodCloud.id,
      price: '50000.00',
    },
  ]);

  const discountEvaluationService = new DiscountEvaluationService();
  const approvalRoutingService = new ApprovalRoutingService();
  const riskCalculationService = new RiskCalculationService();

  console.log('✓ Master data, products, categories, price lists, and discount rules configured.\n');

  // =========================================================================
  // SCENARIO 1 — No Violation (Auto-Approval)
  // Gold Tier (15%) + Hardware (10%) => Effective Limit = 10%
  // Applied Discount = 8% => Excess = 0% => Risk = 0.00 => Auto Approved
  // =========================================================================
  console.log('[Scenario 1] Testing No Violation / Auto Approval...');
  const quote1 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: standardPriceList.id,
      currency: 'INR',
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
      notes: 'Standard discount quotation within allowed limits',
    },
    salesRepUser
  );

  await quotationsService.addItem(
    quote1.id,
    {
      productId: prodServer.id,
      quantity: 1,
      discountPercent: '8.00',
    },
    salesRepUser
  );

  const eval1 = await discountEvaluationService.evaluateQuotation(quote1.id);
  if (eval1.riskScore !== 0 || eval1.approvalRequired !== false) {
    throw new Error(`Scenario 1 Failed: Expected riskScore 0 and approvalRequired false, got ${eval1.riskScore}`);
  }

  const submit1 = await approvalRoutingService.submitQuotation(
    quote1.id,
    salesRepUser.userId,
    Roles.SALES_REP
  );

  if (submit1.status !== QuotationStatuses.APPROVED || submit1.approvals.length !== 0) {
    throw new Error(`Scenario 1 Failed: Expected status APPROVED with 0 approvals, got ${submit1.status}`);
  }
  console.log('✓ Scenario 1 Passed: Applied 8% <= Allowed 10% auto-approved with status APPROVED.\n');

  // =========================================================================
  // SCENARIO 2 — Moderate Violation (Manager Approval Only)
  // Gold Tier (15%) + Hardware (10%) => Effective Limit = 10%
  // Applied Discount = 22% => Excess = 12% => Weighted Risk = 12.00% (<= 15.0)
  // Route: MANAGER => PENDING_MANAGER_APPROVAL => Manager Approves => APPROVED
  // =========================================================================
  console.log('[Scenario 2] Testing Moderate Violation (Manager Approval Route)...');
  const quote2 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: standardPriceList.id,
      currency: 'INR',
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
      notes: 'Moderate discount quotation requiring manager signoff',
    },
    salesRepUser
  );

  await quotationsService.addItem(
    quote2.id,
    {
      productId: prodServer.id,
      quantity: 1,
      discountPercent: '22.00',
    },
    salesRepUser
  );

  const eval2 = await discountEvaluationService.evaluateQuotation(quote2.id);
  if (eval2.riskScore !== 12 || eval2.approvalRoute !== 'MANAGER') {
    throw new Error(`Scenario 2 Failed: Expected riskScore 12.00 and route MANAGER, got ${eval2.riskScore} (${eval2.approvalRoute})`);
  }

  const submit2 = await approvalRoutingService.submitQuotation(
    quote2.id,
    salesRepUser.userId,
    Roles.SALES_REP
  );

  if (
    submit2.status !== QuotationStatuses.PENDING_MANAGER_APPROVAL ||
    submit2.approvals.length !== 1 ||
    submit2.approvals[0].approvalLevel !== ApprovalLevels.MANAGER
  ) {
    throw new Error(`Scenario 2 Failed: Expected PENDING_MANAGER_APPROVAL with 1 Manager approval, got ${submit2.status}`);
  }

  // Manager approves
  const managerApprovalId = submit2.approvals[0].id;
  const approveResult2 = await approvalRoutingService.approveApproval(
    managerApprovalId,
    salesManagerUser.userId,
    Roles.SALES_MANAGER,
    'Approved as strategic deal'
  );

  if (approveResult2.quotationStatus !== QuotationStatuses.APPROVED) {
    throw new Error(`Scenario 2 Failed: Quotation did not transition to APPROVED after manager approval`);
  }
  console.log('✓ Scenario 2 Passed: Risk 12.00% routed to Manager and approved to APPROVED.\n');

  // =========================================================================
  // SCENARIO 3 — High Risk Violation (Manager + Finance Multi-Tier Approval)
  // Gold Tier (15%) + Hardware (10%) => Effective Limit = 10%
  // Applied Discount = 35% => Excess = 25% => Weighted Risk = 25.00% (> 15.0)
  // Route: MANAGER_AND_FINANCE => PENDING_MANAGER_APPROVAL => Manager Approves
  // => PENDING_FINANCE_APPROVAL => Finance Approves => APPROVED
  // =========================================================================
  console.log('[Scenario 3] Testing High Risk Multi-Tier Approval (Manager + Finance)...');
  const quote3 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: standardPriceList.id,
      currency: 'INR',
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
      notes: 'High discount quote requiring Finance and Manager approvals',
    },
    salesRepUser
  );

  await quotationsService.addItem(
    quote3.id,
    {
      productId: prodServer.id,
      quantity: 1,
      discountPercent: '35.00',
    },
    salesRepUser
  );

  const eval3 = await discountEvaluationService.evaluateQuotation(quote3.id);
  if (eval3.riskScore !== 25 || eval3.approvalRoute !== 'MANAGER_AND_FINANCE') {
    throw new Error(`Scenario 3 Failed: Expected riskScore 25.00 and route MANAGER_AND_FINANCE, got ${eval3.riskScore} (${eval3.approvalRoute})`);
  }

  const submit3 = await approvalRoutingService.submitQuotation(
    quote3.id,
    salesRepUser.userId,
    Roles.SALES_REP
  );

  if (
    submit3.status !== QuotationStatuses.PENDING_MANAGER_APPROVAL ||
    submit3.approvals.length !== 2
  ) {
    throw new Error(`Scenario 3 Failed: Expected 2 approval records (seq 1 Manager, seq 2 Finance)`);
  }

  const managerApp = submit3.approvals.find((a) => a.approvalLevel === ApprovalLevels.MANAGER)!;
  const financeApp = submit3.approvals.find((a) => a.approvalLevel === ApprovalLevels.FINANCE)!;

  // Verify Finance cannot approve step 2 before Manager approves step 1
  let financeBlocked = false;
  try {
    await approvalRoutingService.approveApproval(
      financeApp.id,
      financeUser.userId,
      Roles.FINANCE_OPERATIONS,
      'Attempt premature approval'
    );
  } catch (err: any) {
    financeBlocked = true;
  }
  if (!financeBlocked) {
    throw new Error('Scenario 3 Failed: Finance was allowed to approve before Manager approved step 1');
  }

  // Step 1: Manager approves
  const stage1Result = await approvalRoutingService.approveApproval(
    managerApp.id,
    salesManagerUser.userId,
    Roles.SALES_MANAGER,
    'Manager discount signoff'
  );

  if (stage1Result.quotationStatus !== QuotationStatuses.PENDING_FINANCE_APPROVAL) {
    throw new Error(`Scenario 3 Failed: Expected status PENDING_FINANCE_APPROVAL after stage 1, got ${stage1Result.quotationStatus}`);
  }

  // Step 2: Finance approves
  const stage2Result = await approvalRoutingService.approveApproval(
    financeApp.id,
    financeUser.userId,
    Roles.FINANCE_OPERATIONS,
    'Finance budget clearance approved'
  );

  if (stage2Result.quotationStatus !== QuotationStatuses.APPROVED) {
    throw new Error(`Scenario 3 Failed: Expected status APPROVED after stage 2, got ${stage2Result.quotationStatus}`);
  }
  console.log('✓ Scenario 3 Passed: Multi-tier sequential approval (Manager -> Finance -> APPROVED) verified.\n');

  // =========================================================================
  // SCENARIO 4 — Rejection Flow with Reason
  // =========================================================================
  console.log('[Scenario 4] Testing Rejection Flow...');
  const quote4 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: standardPriceList.id,
      currency: 'INR',
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
    },
    salesRepUser
  );

  await quotationsService.addItem(
    quote4.id,
    {
      productId: prodServer.id,
      quantity: 1,
      discountPercent: '30.00',
    },
    salesRepUser
  );

  const submit4 = await approvalRoutingService.submitQuotation(
    quote4.id,
    salesRepUser.userId,
    Roles.SALES_REP
  );

  const rejectApp = submit4.approvals[0];
  const rejectResult = await approvalRoutingService.rejectApproval(
    rejectApp.id,
    salesManagerUser.userId,
    Roles.SALES_MANAGER,
    'Margin too low for this customer tier'
  );

  if (rejectResult.quotationStatus !== QuotationStatuses.REJECTED) {
    throw new Error(`Scenario 4 Failed: Expected quotation status REJECTED, got ${rejectResult.quotationStatus}`);
  }
  console.log('✓ Scenario 4 Passed: Rejection flow and status transition to REJECTED verified.\n');

  // =========================================================================
  // SCENARIO 5 & 6 — Weighted Financial Impact & Blended Risk Calculations
  // Line 1: Server ₹100,000, Applied 15% (Limit 10% => Excess 5% => Contrib 500,000)
  // Line 2: Cloud ₹50,000, Applied 25% (Limit 15% => Excess 10% => Contrib 500,000)
  // Total Gross: ₹150,000 => Weighted Excess = (500000 + 500000) / 150000 = 6.67%
  // =========================================================================
  console.log('[Scenario 5 & 6] Testing Blended Risk & Financial Weighting...');
  const calcTest = riskCalculationService.calculateRisk(
    [
      {
        appliedDiscount: 15,
        effectiveAllowedDiscount: 10,
        lineGrossAmount: 100000,
      },
      {
        appliedDiscount: 25,
        effectiveAllowedDiscount: 15,
        lineGrossAmount: 50000,
      },
    ],
    150000
  );

  if (calcTest.riskScore !== 6.67 || calcTest.totalViolations !== 2) {
    throw new Error(`Scenario 5 & 6 Failed: Expected riskScore 6.67 and 2 violations, got ${calcTest.riskScore}`);
  }
  console.log(`✓ Scenario 5 & 6 Passed: Multi-line weighted excess risk evaluated deterministically at ${calcTest.riskScore}%.\n`);

  // =========================================================================
  // SCENARIO 7 — Invalidation of Active Approvals on Commercial Mutation
  // =========================================================================
  console.log('[Scenario 7] Testing Invalidation on Quotation Commercial Mutation...');
  const quote7 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: standardPriceList.id,
      currency: 'INR',
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
    },
    salesRepUser
  );

  const { item: item7 } = await quotationsService.addItem(
    quote7.id,
    {
      productId: prodServer.id,
      quantity: 1,
      discountPercent: '25.00',
    },
    salesRepUser
  );

  const submit7 = await approvalRoutingService.submitQuotation(
    quote7.id,
    salesRepUser.userId,
    Roles.SALES_REP
  );

  if (submit7.status !== QuotationStatuses.PENDING_MANAGER_APPROVAL) {
    throw new Error(`Scenario 7 Failed: Expected PENDING_MANAGER_APPROVAL`);
  }

  // Sales Rep mutates quantity on the line item
  await quotationsService.updateItem(
    quote7.id,
    item7.id,
    {
      quantity: 2,
    },
    salesRepUser
  );

  const postMutationQuote = await quotationsService.getQuotationById(quote7.id, salesRepUser);
  if (postMutationQuote.status !== QuotationStatuses.DRAFT) {
    throw new Error(`Scenario 7 Failed: Expected status to revert to DRAFT on item mutation, got ${postMutationQuote.status}`);
  }

  const existingApps = await db
    .select()
    .from(quotationApprovals)
    .where(eq(quotationApprovals.quotationId, quote7.id));

  const allInvalidated = existingApps.every((a) => a.status === ApprovalStatuses.INVALIDATED);
  if (!allInvalidated) {
    throw new Error('Scenario 7 Failed: Existing approvals were not invalidated upon quotation line modification');
  }
  console.log('✓ Scenario 7 Passed: Commercial mutation invalidated pending approvals and reset status to DRAFT.\n');

  // =========================================================================
  // SCENARIO 8 — Idempotent / Re-submission Handling
  // =========================================================================
  console.log('[Scenario 8] Testing Re-submission without duplicate active approvals...');
  const submit7Again = await approvalRoutingService.submitQuotation(
    quote7.id,
    salesRepUser.userId,
    Roles.SALES_REP
  );

  const activeApps = await db
    .select()
    .from(quotationApprovals)
    .where(eq(quotationApprovals.quotationId, quote7.id));

  const pendingCount = activeApps.filter((a) => a.status === ApprovalStatuses.PENDING).length;
  if (pendingCount !== submit7Again.approvals.length) {
    throw new Error(`Scenario 8 Failed: Expected ${submit7Again.approvals.length} pending approvals, found ${pendingCount}`);
  }
  console.log('✓ Scenario 8 Passed: Re-submission cleaned prior records and created only fresh active approvals.\n');

  // =========================================================================
  // SCENARIO 9 — Authorization & Role Restrictions
  // =========================================================================
  console.log('[Scenario 9] Testing Approver Authorization Restrictions...');
  const activeApproval = submit7Again.approvals[0];

  // 1. Sales Rep cannot approve
  let repBlocked = false;
  try {
    await approvalRoutingService.approveApproval(
      activeApproval.id,
      salesRepUser.userId,
      Roles.SALES_REP
    );
  } catch (err: any) {
    repBlocked = true;
  }
  if (!repBlocked) {
    throw new Error('Scenario 9 Failed: Sales Rep was not blocked from approving');
  }

  // 2. Finance cannot approve a Manager level step
  let financeOnManagerBlocked = false;
  try {
    await approvalRoutingService.approveApproval(
      activeApproval.id,
      financeUser.userId,
      Roles.FINANCE_OPERATIONS
    );
  } catch (err: any) {
    financeOnManagerBlocked = true;
  }
  if (!financeOnManagerBlocked) {
    throw new Error('Scenario 9 Failed: Finance was not blocked from approving Manager step');
  }

  // 3. Admin can approve any step
  const adminApproveResult = await approvalRoutingService.approveApproval(
    activeApproval.id,
    adminUser.userId,
    Roles.ADMIN,
    'Executive override approval'
  );
  if (adminApproveResult.quotationStatus !== QuotationStatuses.APPROVED) {
    throw new Error('Scenario 9 Failed: Admin approval bypass failed');
  }
  console.log('✓ Scenario 9 Passed: Strict role authorization and Admin bypass verified.\n');

  console.log('========================================');
  console.log('ALL PHASE 6 TESTS PASSED SUCCESSFULLY! ✓');
  console.log('========================================');
}

runPhase6Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Phase 6 Test Suite Failed:', err);
    process.exit(1);
  });
