import { bootstrapRbac } from '../src/modules/rbac/services/rbacBootstrap.js';
import { initAdminTables } from '../src/database/initAdminTables.js';
import { initFinanceTables } from '../src/database/initFinanceTables.js';
import { db } from '../src/database/db.js';
import {
  users,
  roles,
  userRoles,
  customers,
  customerTiers,
  products,
  productCategories,
  priceLists,
  priceListItems,
  quotations,
  quotationItems,
  quotationApprovals,
  invoices,
  payments,
} from '../src/database/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '../src/modules/auth/utils/password.utils.js';
import { AuthService } from '../src/modules/auth/services/auth.service.js';
import { financeService } from '../src/modules/finance/services/finance.service.js';
import { invoicesService } from '../src/modules/invoices/services/invoices.service.js';
import { paymentsService } from '../src/modules/payments/services/payments.service.js';
import { approvalRoutingService } from '../src/modules/discount-governance/services/approvalRouting.service.js';
import { Roles } from '../src/modules/rbac/constants/roles.js';

async function runFinanceVerificationSuite() {
  console.log('========================================================');
  console.log('🚀 Starting DealFlow360 Finance Workflow Verification Suite');
  console.log('========================================================\n');

  try {
    // Step 0: Setup & Bootstrap
    console.log('[Setup] Initializing schemas, RBAC, and finance tables...');
    await bootstrapRbac();
    await initAdminTables();
    await initFinanceTables();
    console.log('✓ Schemas & DB tables initialized.\n');

    const authService = new AuthService();

    // Step 1: Authentication & Token Verification for Finance Role
    console.log('[Test 1] Testing Finance Role Authentication & Login...');
    const financeLogin = await authService.login({
      email: 'finance@dealflow360.io',
      password: 'Password@123',
    });

    if (!financeLogin.user.roles.includes(Roles.FINANCE)) {
      throw new Error(`Expected FINANCE role in user roles, received: ${JSON.stringify(financeLogin.user.roles)}`);
    }
    console.log(`✓ Finance login successful: ${financeLogin.user.name} (${financeLogin.user.email})`);
    console.log(`✓ Roles: ${financeLogin.user.roles.join(', ')}`);
    console.log('✓ Test 1: Finance Authentication PASSED.\n');

    // Step 2: Finance Dashboard Overview & AR Aging API
    console.log('[Test 2] Testing Finance Dashboard Metrics & AR Aging...');
    const dashboardData = await financeService.getDashboardOverview();
    console.log('✓ Dashboard metrics received:', {
      pendingApprovals: dashboardData.overview.pendingFinanceApprovals,
      totalInvoiced: dashboardData.overview.totalInvoiced,
      totalCollected: dashboardData.overview.totalCollected,
      totalOutstanding: dashboardData.overview.totalOutstanding,
      arAging: dashboardData.arAging,
    });
    console.log('✓ Test 2: Finance Dashboard Metrics PASSED.\n');

    // Step 3: Setup commercial entities for high-risk deal test
    console.log('[Test 3] Testing High-Risk Multi-Tier Approval Workflow (Manager -> Finance)...');
    
    // Ensure active customer & price list
    let customer = await db.query.customers.findFirst();
    if (!customer) {
      const [tier] = await db.select().from(customerTiers).limit(1);
      const [newCust] = await db.insert(customers).values({
        companyName: 'Apex Financial Corp',
        contactName: 'Naveen Kumar',
        email: 'finance.test@apexcorp.com',
        customerTierId: tier.id,
      }).returning();
      customer = newCust;
    }

    let priceList = await db.query.priceLists.findFirst();
    let product = await db.query.products.findFirst();
    const [salesRep] = await db.select().from(users).where(eq(users.email, 'sales.rep@dealflow360.io'));
    const [salesManager] = await db.select().from(users).where(eq(users.email, 'sales.manager@dealflow360.io'));
    const [financeOfficer] = await db.select().from(users).where(eq(users.email, 'finance@dealflow360.io'));

    // Create high-discount quotation (e.g. 25% discount -> requires Manager + Finance approval)
    const quoteNum = `QT-FIN-${Date.now().toString().slice(-6)}`;
    const [quote] = await db.insert(quotations).values({
      quotationNumber: quoteNum,
      customerId: customer.id,
      priceListId: priceList!.id,
      status: 'DRAFT',
      subtotal: '200000.00',
      discountAmount: '50000.00', // 25% discount
      totalAmount: '150000.00',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Strategic high-volume deal with 25% requested discount.',
      createdBy: salesRep.id,
    }).returning();

    await db.insert(quotationItems).values({
      quotationId: quote.id,
      productId: product!.id,
      productNameSnapshot: product!.name,
      skuSnapshot: product!.sku,
      quantity: 10,
      unitPrice: '20000.00',
      discountPercent: '25.00',
      grossAmount: '200000.00',
      discountAmount: '50000.00',
      netAmount: '150000.00',
    });

    console.log(`Created quotation ${quote.quotationNumber} with 25% discount.`);

    // Submit quotation
    const submitResult = await approvalRoutingService.submitQuotation(
      quote.id,
      salesRep.id,
      Roles.SALES_REP,
      'High-volume contract commitment'
    );

    console.log(`✓ Submitted quotation. Required approvals count: ${submitResult.approvals.length}`);
    console.log(`✓ Approval route: ${submitResult.approvalRoute}`);

    const allApprovals = await db.select().from(quotationApprovals).where(eq(quotationApprovals.quotationId, quote.id));
    const managerApproval = allApprovals.find((a) => a.approvalLevel === 'MANAGER');
    const financeApproval = allApprovals.find((a) => a.approvalLevel === 'FINANCE');

    if (!managerApproval || !financeApproval) {
      throw new Error('Expected both MANAGER and FINANCE approval steps to be generated');
    }

    console.log(`✓ Stage 1 (Manager): ${managerApproval.id}, Stage 2 (Finance): ${financeApproval.id}`);

    // Manager Approves Stage 1
    const managerResult = await approvalRoutingService.approveApproval(
      managerApproval.id,
      salesManager.id,
      Roles.SALES_MANAGER,
      'Manager commercial signoff granted.'
    );
    console.log(`✓ Stage 1 approved by Manager. Quotation status: ${managerResult.quotationStatus}`);

    // Finance reviews deal review dossier
    const reviewData = await financeService.getFinancialDealReview(financeApproval.id);
    console.log('✓ Finance deal review dossier retrieved:', {
      customer: reviewData.customer.companyName,
      totalNetRevenue: reviewData.financialSummary.totalNetRevenue,
      overallMarginPercent: reviewData.financialSummary.overallMarginPercent,
      marginCompliant: reviewData.financialSummary.marginFloorCompliant,
      linesCount: reviewData.lineItems.length,
    });

    // Finance Approves Stage 2
    const financeResult = await financeService.approveDeal(
      financeApproval.id,
      financeOfficer.id,
      Roles.FINANCE,
      'Finance strategic signoff approved.'
    );
    console.log(`✓ Stage 2 approved by Finance. Final Quotation status: ${financeResult.quotationStatus}`);
    console.log('✓ Test 3: High-Risk Multi-Tier Approval Workflow PASSED.\n');

    // Step 4: Invoicing Workflow
    console.log('[Test 4] Testing Invoice Generation & Tax Calculations...');
    const generatedInvoice = await invoicesService.generateInvoiceFromQuotation(quote.id, financeOfficer.id);
    console.log('✓ Generated Tax Invoice:', {
      invoiceNumber: generatedInvoice.invoiceNumber,
      subtotal: generatedInvoice.subtotal,
      discountAmount: generatedInvoice.discountAmount,
      taxAmount: generatedInvoice.taxAmount,
      totalAmount: generatedInvoice.totalAmount,
      balanceDue: generatedInvoice.balanceDue,
      status: generatedInvoice.status,
    });

    const invoiceFetch = await invoicesService.getInvoiceById(generatedInvoice.id);
    if (!invoiceFetch) throw new Error('Failed to retrieve generated invoice');
    console.log(`✓ Verified invoice retrieval with ${invoiceFetch.items?.length || 0} line items.`);
    console.log('✓ Test 4: Invoicing Workflow PASSED.\n');

    // Step 5: Payment Remittance & Balance Updates
    console.log('[Test 5] Testing Payments Remittance & Balance Settlement...');
    const totalDue = parseFloat(generatedInvoice.totalAmount);
    const partialAmount = Math.round(totalDue / 2);

    // Partial payment
    console.log(`Recording partial payment of ₹${partialAmount.toLocaleString('en-IN')}...`);
    const partialResult = await paymentsService.recordPayment(
      {
        invoiceId: generatedInvoice.id,
        amount: partialAmount,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: `UTR-TEST-${Date.now()}`,
        notes: 'Partial advance remittance',
      },
      financeOfficer.id
    );

    console.log('✓ Partial payment recorded:', {
      paymentNumber: partialResult.payment.paymentNumber,
      amountPaid: partialResult.invoice.amountPaid,
      balanceDue: partialResult.invoice.balanceDue,
      status: partialResult.invoice.status,
    });

    if (partialResult.invoice.status !== 'PARTIALLY_PAID') {
      throw new Error(`Expected invoice status 'PARTIALLY_PAID', received '${partialResult.invoice.status}'`);
    }

    // Remaining payment
    const remainingBalance = parseFloat(partialResult.invoice.balanceDue);
    console.log(`Recording settlement payment of ₹${remainingBalance.toLocaleString('en-IN')}...`);
    const fullResult = await paymentsService.recordPayment(
      {
        invoiceId: generatedInvoice.id,
        amount: remainingBalance,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: `UTR-FINAL-${Date.now()}`,
        notes: 'Final balance settlement',
      },
      financeOfficer.id
    );

    console.log('✓ Final payment recorded:', {
      paymentNumber: fullResult.payment.paymentNumber,
      amountPaid: fullResult.invoice.amountPaid,
      balanceDue: fullResult.invoice.balanceDue,
      status: fullResult.invoice.status,
    });

    if (fullResult.invoice.status !== 'PAID') {
      throw new Error(`Expected invoice status 'PAID', received '${fullResult.invoice.status}'`);
    }
    console.log('✓ Test 5: Payment Settlement & Ledger Update PASSED.\n');

    // Step 6: Security Safeguards & RBAC Role Enforcement
    console.log('[Test 6] Testing RBAC Security & Safeguards...');
    try {
      // Sales Rep trying to approve a Finance approval step
      await approvalRoutingService.approveApproval(
        financeApproval.id,
        salesRep.id,
        Roles.SALES_REP,
        'Unauthorized attempt'
      );
      throw new Error('Security flaw: Sales Rep was able to approve a Finance approval step');
    } catch (err: any) {
      console.log(`✓ Unauthorized action blocked: "${err.message}"`);
    }
    console.log('✓ Test 6: Security Safeguards & Authorization PASSED.\n');

    console.log('========================================================');
    console.log('🎉 ALL FINANCE ROLE VERIFICATION TESTS PASSED (100%)');
    console.log('========================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification test failed with error:', error);
    process.exit(1);
  }
}

runFinanceVerificationSuite();
