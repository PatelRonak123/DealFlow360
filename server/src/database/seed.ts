import { bootstrapRbac } from '../modules/rbac/index.js';
import { db, pool } from './db.js';
import {
  users,
  userRoles,
  roles,
  customerTiers,
  productCategories,
  products,
  priceLists,
  priceListItems,
  customerTierDiscountRules,
  categoryDiscountRules,
  customers,
  warehouses,
  warehouseInventory,
  quotations,
  quotationItems,
  quotationApprovals,
  quotationDiscountEvaluations,
  fulfillments,
  fulfillmentAllocations,
  subscriptionPlans,
  systemSettings,
  invoices,
  invoiceItems,
  payments,
  recommendationRules,
} from './schema/index.js';
import { hashPassword } from '../modules/auth/utils/password.utils.js';
import { Roles } from '../modules/rbac/constants/roles.js';
import { eq } from 'drizzle-orm';
import { initAdminTables } from './initAdminTables.js';
import { initFinanceTables } from './initFinanceTables.js';

/**
 * DealFlow360 — Complete Multi-Role Enterprise Seed Script
 * 
 * Populates realistic, interconnected demo data for ALL 5 platform roles:
 * 1. ADMIN          (Control center, user/role matrix, product master, warehouses, settings)
 * 2. SALES_REP      (Customers, quotations in multiple stages, pipeline, deal health)
 * 3. SALES_MANAGER  (Pending discount approvals, team pipeline, margin risk governance)
 * 4. FINANCE        (Tier-2 high risk approvals, dossier review, tax invoices, payments, AR aging)
 * 5. CUSTOMER       (Customer portal: my quotes, orders/fulfillments, invoices, payments, subscriptions)
 */

export async function seedDatabase(): Promise<void> {
  console.log('================================================================');
  console.log('🚀 DealFlow360 — Starting Multi-Role Comprehensive Database Seeding');
  console.log('================================================================');

  try {
    // 1. Ensure schema tables exist
    await initAdminTables();
    await initFinanceTables();

    // 2. Bootstrap RBAC permissions & roles
    console.log('[1/12] Bootstrapping RBAC permissions & roles...');
    await bootstrapRbac();

    const allDbRoles = await db.select().from(roles);
    const roleMap = new Map(allDbRoles.map((r) => [r.name, r.id]));

    // 3. Seed/update canonical users for all 5 roles
    console.log('[2/12] Configuring canonical users for all 5 roles...');
    const defaultPasswordHash = await hashPassword('Password@123');

    const SEED_USERS = [
      { name: 'Platform Administrator', email: 'admin@dealflow360.io', role: Roles.ADMIN },
      { name: 'Alex Johnson (Sales Rep)', email: 'sales.rep@dealflow360.io', role: Roles.SALES_REP },
      { name: 'Sarah Mitchell (Sales Manager)', email: 'sales.manager@dealflow360.io', role: Roles.SALES_MANAGER },
      { name: 'David Miller (Finance Officer)', email: 'finance@dealflow360.io', role: Roles.FINANCE },
      { name: 'John Doe (Acme Procurement)', email: 'customer@dealflow360.io', role: Roles.CUSTOMER },
    ];

    const userMap = new Map<string, string>();

    for (const u of SEED_USERS) {
      const roleId = roleMap.get(u.role);
      if (!roleId) continue;

      const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
      let userId: string;

      if (existing.length > 0) {
        userId = existing[0].id;
        await db
          .update(users)
          .set({
            name: u.name,
            passwordHash: defaultPasswordHash,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        const [inserted] = await db
          .insert(users)
          .values({
            name: u.name,
            email: u.email,
            passwordHash: defaultPasswordHash,
            isActive: true,
          })
          .returning();
        userId = inserted.id;
      }

      await db
        .insert(userRoles)
        .values({ userId, roleId })
        .onConflictDoNothing();

      userMap.set(u.role, userId);
      console.log(`  ✓ Configured user: ${u.email} -> [${u.role}]`);
    }

    const repId = userMap.get(Roles.SALES_REP)!;
    const managerId = userMap.get(Roles.SALES_MANAGER)!;
    const financeId = userMap.get(Roles.FINANCE)!;

    // 4. System Settings
    console.log('[3/12] Configuring System Settings...');
    const existingSettings = await db.select().from(systemSettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(systemSettings).values({
        companyName: 'DealFlow360 Technologies Pvt Ltd',
        supportEmail: 'admin@dealflow360.com',
        supportPhone: '+91 98765 43210',
        defaultCurrency: 'INR',
        defaultTaxRate: '18.00',
        quoteExpirationDays: '30',
        approvalThresholdPercent: '10.00',
        companyAddress: 'Level 7, Cyber Tower, Hi-Tech City, Hyderabad, India',
      });
    }

    // 5. Customer Tiers
    console.log('[4/12] Seeding Customer Tiers...');
    const tierDefinitions = [
      { name: 'Platinum', description: 'Enterprise VIP Tier ($100k+ ARR)', minAnnualSpend: '1000000.00', badgeColor: 'purple' },
      { name: 'Gold', description: 'Key Strategic Clients ($50k+ ARR)', minAnnualSpend: '500000.00', badgeColor: 'amber' },
      { name: 'Silver', description: 'Standard Commercial Tier', minAnnualSpend: '200000.00', badgeColor: 'blue' },
      { name: 'Bronze', description: 'Entry Tier & SMB Accounts', minAnnualSpend: '50000.00', badgeColor: 'slate' },
    ];

    for (const t of tierDefinitions) {
      await db.insert(customerTiers).values(t).onConflictDoNothing();
    }
    const allTiers = await db.select().from(customerTiers);
    const tierMap = new Map(allTiers.map((t) => [t.name, t.id]));

    // 6. Product Categories
    console.log('[5/12] Seeding Product Categories...');
    const categoryDefinitions = [
      { name: 'Enterprise Software', description: 'Core application licenses, seats, and compute tiers' },
      { name: 'Hardware Solutions', description: 'Edge servers, data center hardware, and smart appliances' },
      { name: 'Professional Services', description: 'Consulting, architectural onboarding, and 24/7 SLA' },
      { name: 'Cloud Subscriptions', description: 'Recurring SaaS compute, storage, and AI processing' },
    ];

    for (const c of categoryDefinitions) {
      await db.insert(productCategories).values(c).onConflictDoNothing();
    }
    const allCategories = await db.select().from(productCategories);
    const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

    // 7. Products Master
    console.log('[6/12] Seeding Products Master...');
    const swCatId = categoryMap.get('Enterprise Software') || allCategories[0].id;
    const hwCatId = categoryMap.get('Hardware Solutions') || allCategories[0].id;
    const srvCatId = categoryMap.get('Professional Services') || allCategories[0].id;
    const cloudCatId = categoryMap.get('Cloud Subscriptions') || allCategories[0].id;

    const productDefinitions = [
      { name: 'DealFlow360 Enterprise License (Annual)', sku: 'DF360-ENT-YR', categoryId: swCatId, productType: 'SUBSCRIPTION', basePrice: '150000.00', stock: 999 },
      { name: 'High-Performance Edge Server X8', sku: 'SRV-EDGE-X8', categoryId: hwCatId, productType: 'PHYSICAL', basePrice: '450000.00', stock: 50 },
      { name: '24/7 Dedicated Support & Premium SLA', sku: 'SLA-PREM-247', categoryId: srvCatId, productType: 'SERVICE', basePrice: '75000.00', stock: 100 },
      { name: 'Security Audit & Compliance Pack', sku: 'SEC-AUDIT-PKG', categoryId: srvCatId, productType: 'SERVICE', basePrice: '120000.00', stock: 80 },
      { name: 'Cloud AI Compute Processing Addon', sku: 'CLD-AI-ADDON', categoryId: cloudCatId, productType: 'SUBSCRIPTION', basePrice: '35000.00', stock: 500 },
      { name: 'Rackmount Power Distribution Unit (PDU)', sku: 'HW-PDU-32A', categoryId: hwCatId, productType: 'PHYSICAL', basePrice: '28000.00', stock: 120 },
    ];

    for (const p of productDefinitions) {
      await db.insert(products).values(p).onConflictDoNothing();
    }
    const allProducts = await db.select().from(products);
    const prodMap = new Map(allProducts.map((p) => [p.sku, p.id]));

    // Recommendation rules (AI Upsell/Cross-sell)
    const swProdId = prodMap.get('DF360-ENT-YR');
    const srvProdId = prodMap.get('SLA-PREM-247');
    const hwProdId = prodMap.get('SRV-EDGE-X8');
    const secProdId = prodMap.get('SEC-AUDIT-PKG');

    if (swProdId && srvProdId) {
      await db
        .insert(recommendationRules)
        .values({
          sourceProductId: swProdId,
          recommendedProductId: srvProdId,
          recommendationType: 'UPSELL',
          priority: 'HIGH',
          defaultQuantity: 1,
          description: 'Attach 24/7 Dedicated Support SLA to Enterprise software licenses',
        })
        .onConflictDoNothing();
    }

    if (hwProdId && secProdId) {
      await db
        .insert(recommendationRules)
        .values({
          sourceProductId: hwProdId,
          recommendedProductId: secProdId,
          recommendationType: 'CROSS_SELL',
          priority: 'HIGH',
          defaultQuantity: 1,
          description: 'Recommend Security Compliance pack with High-Performance Edge servers',
        })
        .onConflictDoNothing();
    }

    // 8. Price Lists
    console.log('[7/12] Seeding Enterprise Price Lists...');
    const [standardList] = await db
      .insert(priceLists)
      .values({
        name: 'Standard Commercial Price List (INR)',
        description: 'Standard domestic enterprise price schedule',
        currency: 'INR',
        isDefault: true,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    const priceListId = standardList ? standardList.id : (await db.select().from(priceLists).limit(1))[0].id;

    for (const p of allProducts) {
      await db
        .insert(priceListItems)
        .values({
          priceListId,
          productId: p.id,
          price: p.basePrice,
        })
        .onConflictDoNothing();
    }

    // Discount Governance Rules
    const platTierId = tierMap.get('Platinum') || allTiers[0].id;
    const goldTierId = tierMap.get('Gold') || allTiers[1].id;

    await db
      .insert(customerTierDiscountRules)
      .values({
        customerTierId: platTierId,
        maxDiscountPercent: '30.00',
        isActive: true,
      })
      .onConflictDoNothing();

    await db
      .insert(customerTierDiscountRules)
      .values({
        customerTierId: goldTierId,
        maxDiscountPercent: '20.00',
        isActive: true,
      })
      .onConflictDoNothing();

    await db
      .insert(categoryDiscountRules)
      .values({
        categoryId: swCatId,
        maxDiscountPercent: '25.00',
        isActive: true,
      })
      .onConflictDoNothing();

    // 9. Warehouses & Stock
    console.log('[8/12] Seeding Logistics Warehouses & Stock...');
    const warehouseDefs = [
      { name: 'Main Distribution Hub', code: 'WH-MUM-01', city: 'Mumbai', state: 'Maharashtra', address: 'Plot 42, MIDC Industrial Area, Andheri East' },
      { name: 'North Logistics Center', code: 'WH-DEL-02', city: 'Delhi', state: 'Delhi NCR', address: 'Block C, Okhla Phase II' },
      { name: 'South Tech Hub', code: 'WH-BLR-03', city: 'Bengaluru', state: 'Karnataka', address: 'Electronic City Phase 1' },
    ];

    for (const w of warehouseDefs) {
      await db.insert(warehouses).values(w).onConflictDoNothing();
    }
    const allWarehouses = await db.select().from(warehouses);

    for (const wh of allWarehouses) {
      for (const prod of allProducts) {
        await db
          .insert(warehouseInventory)
          .values({
            warehouseId: wh.id,
            productId: prod.id,
            quantityOnHand: 40,
            reservedQuantity: 5,
            reorderLevel: 10,
          })
          .onConflictDoNothing();
      }
    }

    // 10. Customers (linked to rep & customer role)
    console.log('[9/12] Seeding Enterprise Customer Accounts...');
    const customerDefs = [
      {
        companyName: 'Acme Corporation Global',
        contactName: 'John Doe',
        email: 'customer@dealflow360.io',
        phone: '+91 98111 22233',
        customerTierId: platTierId,
        status: 'ACTIVE',
      },
      {
        companyName: 'Infosource Technologies Ltd',
        contactName: 'Priya Sharma',
        email: 'procurement@infosource.com',
        phone: '+91 98222 33344',
        customerTierId: goldTierId,
        status: 'ACTIVE',
      },
      {
        companyName: 'Zenith Health Systems',
        contactName: 'Marcus Vance',
        email: 'marcus.v@zenithhealth.org',
        phone: '+91 98333 44455',
        customerTierId: tierMap.get('Silver') || allTiers[0].id,
        status: 'ACTIVE',
      },
      {
        companyName: 'Apex Cloud Infrastructures',
        contactName: 'Ananya Roy',
        email: 'ops@apexcloud.io',
        phone: '+91 98444 55566',
        customerTierId: platTierId,
        status: 'ACTIVE',
      },
    ];

    for (const c of customerDefs) {
      await db.insert(customers).values(c).onConflictDoNothing();
    }
    const allCustomers = await db.select().from(customers);
    const custMap = new Map(allCustomers.map((c) => [c.email, c.id]));
    const acmeId = custMap.get('customer@dealflow360.io') || allCustomers[0].id;
    const infosourceId = custMap.get('procurement@infosource.com') || allCustomers[1].id;
    const zenithId = custMap.get('marcus.v@zenithhealth.org') || allCustomers[2].id;
    const apexId = custMap.get('ops@apexcloud.io') || allCustomers[3].id;

    // 11. Quotations, Approvals & Evaluations
    console.log('[10/12] Seeding Quotations & Approval Workflows across All Roles...');
    const today = new Date();
    const issueDateStr = today.toISOString().split('T')[0];
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + 30);
    const expiryDateStr = expiryDate.toISOString().split('T')[0];

    // Quote 1: Approved Deal for Acme Corp (Ready for Invoice & Order)
    const [q1] = await db
      .insert(quotations)
      .values({
        quotationNumber: 'QT-2026-101',
        customerId: acmeId,
        priceListId,
        status: 'APPROVED',
        currency: 'INR',
        subtotal: '225000.00',
        discountAmount: '25000.00',
        totalAmount: '200000.00',
        issueDate: issueDateStr,
        expiryDate: expiryDateStr,
        notes: 'Annual enterprise license with attached premium SLA support package.',
        createdBy: repId,
      })
      .onConflictDoNothing()
      .returning();

    // Quote 2: High-Risk Multi-Tier Quotation (Pending Finance Stage 2)
    const [q2] = await db
      .insert(quotations)
      .values({
        quotationNumber: 'QT-2026-102',
        customerId: acmeId,
        priceListId,
        status: 'PENDING_FINANCE_APPROVAL',
        currency: 'INR',
        subtotal: '450000.00',
        discountAmount: '112500.00',
        totalAmount: '337500.00',
        issueDate: issueDateStr,
        expiryDate: expiryDateStr,
        notes: 'High-volume server purchase with 25% discount requested. Stage 1 Manager signed off, awaiting Finance review.',
        createdBy: repId,
      })
      .onConflictDoNothing()
      .returning();

    // Quote 3: Quotation Pending Manager Approval (Sequence 1)
    const [q3] = await db
      .insert(quotations)
      .values({
        quotationNumber: 'QT-2026-103',
        customerId: infosourceId,
        priceListId,
        status: 'PENDING_APPROVAL',
        currency: 'INR',
        subtotal: '150000.00',
        discountAmount: '22500.00',
        totalAmount: '127500.00',
        issueDate: issueDateStr,
        expiryDate: expiryDateStr,
        notes: 'Software license with 15% discount requested. Awaiting Sales Manager review.',
        createdBy: repId,
      })
      .onConflictDoNothing()
      .returning();

    // Quote 4: Draft Pipeline Deal for Sales Rep
    const [q4] = await db
      .insert(quotations)
      .values({
        quotationNumber: 'QT-2026-104',
        customerId: zenithId,
        priceListId,
        status: 'DRAFT',
        currency: 'INR',
        subtotal: '120000.00',
        discountAmount: '6000.00',
        totalAmount: '114000.00',
        issueDate: issueDateStr,
        expiryDate: expiryDateStr,
        notes: 'Security compliance and audit package proposal in negotiation.',
        createdBy: repId,
      })
      .onConflictDoNothing()
      .returning();

    // Quote 5: Approved High-Value Deal for Apex Cloud
    const [q5] = await db
      .insert(quotations)
      .values({
        quotationNumber: 'QT-2026-105',
        customerId: apexId,
        priceListId,
        status: 'APPROVED',
        currency: 'INR',
        subtotal: '525000.00',
        discountAmount: '52500.00',
        totalAmount: '472500.00',
        issueDate: issueDateStr,
        expiryDate: expiryDateStr,
        notes: 'Multi-server cluster deployment with cloud AI compute addon.',
        createdBy: repId,
      })
      .onConflictDoNothing()
      .returning();

    // Add Line items for seeded quotations
    const q1Id = q1 ? q1.id : (await db.select().from(quotations).where(eq(quotations.quotationNumber, 'QT-2026-101')).limit(1))[0]?.id;
    const q2Id = q2 ? q2.id : (await db.select().from(quotations).where(eq(quotations.quotationNumber, 'QT-2026-102')).limit(1))[0]?.id;
    const q3Id = q3 ? q3.id : (await db.select().from(quotations).where(eq(quotations.quotationNumber, 'QT-2026-103')).limit(1))[0]?.id;
    const q5Id = q5 ? q5.id : (await db.select().from(quotations).where(eq(quotations.quotationNumber, 'QT-2026-105')).limit(1))[0]?.id;

    if (q1Id && swProdId && srvProdId) {
      await db.insert(quotationItems).values([
        {
          quotationId: q1Id,
          productId: swProdId,
          productNameSnapshot: 'DealFlow360 Enterprise License (Annual)',
          skuSnapshot: 'DF360-ENT-YR',
          quantity: 1,
          unitPrice: '150000.00',
          discountPercent: '10.00',
          grossAmount: '150000.00',
          discountAmount: '15000.00',
          netAmount: '135000.00',
        },
        {
          quotationId: q1Id,
          productId: srvProdId,
          productNameSnapshot: '24/7 Dedicated Support & Premium SLA',
          skuSnapshot: 'SLA-PREM-247',
          quantity: 1,
          unitPrice: '75000.00',
          discountPercent: '13.33',
          grossAmount: '75000.00',
          discountAmount: '10000.00',
          netAmount: '65000.00',
        },
      ]).onConflictDoNothing();
    }

    if (q2Id && hwProdId) {
      const [it2] = await db.insert(quotationItems).values({
        quotationId: q2Id,
        productId: hwProdId,
        productNameSnapshot: 'High-Performance Edge Server X8',
        skuSnapshot: 'SRV-EDGE-X8',
        quantity: 1,
        unitPrice: '450000.00',
        discountPercent: '25.00',
        grossAmount: '450000.00',
        discountAmount: '112500.00',
        netAmount: '337500.00',
      }).onConflictDoNothing().returning();

      // Seed approvals for Quote 2 (Stage 1 Manager APPROVED, Stage 2 Finance PENDING)
      await db.insert(quotationApprovals).values([
        {
          quotationId: q2Id,
          approvalLevel: 'MANAGER',
          sequence: 1,
          status: 'APPROVED',
          decidedById: managerId,
          comments: 'Approved by Sales Manager. High strategic potential for Acme account.',
          decidedAt: new Date(),
        },
        {
          quotationId: q2Id,
          approvalLevel: 'FINANCE',
          sequence: 2,
          status: 'PENDING',
          comments: null,
        },
      ]).onConflictDoNothing();

      if (it2) {
        await db.insert(quotationDiscountEvaluations).values({
          quotationId: q2Id,
          quotationItemId: it2.id,
          appliedDiscount: '25.00',
          customerTierLimit: '20.00',
          categoryLimit: '20.00',
          effectiveAllowedDiscount: '20.00',
          excessDiscount: '5.00',
          isViolation: true,
          riskContribution: '22500.00',
        }).onConflictDoNothing();
      }
    }

    if (q3Id && swProdId) {
      await db.insert(quotationItems).values({
        quotationId: q3Id,
        productId: swProdId,
        productNameSnapshot: 'DealFlow360 Enterprise License (Annual)',
        skuSnapshot: 'DF360-ENT-YR',
        quantity: 1,
        unitPrice: '150000.00',
        discountPercent: '15.00',
        grossAmount: '150000.00',
        discountAmount: '22500.00',
        netAmount: '127500.00',
      }).onConflictDoNothing();

      // Seed approvals for Quote 3 (Stage 1 Manager PENDING)
      await db.insert(quotationApprovals).values({
        quotationId: q3Id,
        approvalLevel: 'MANAGER',
        sequence: 1,
        status: 'PENDING',
      }).onConflictDoNothing();
    }

    // 12. Invoices, Payments, and Fulfillments
    console.log('[11/12] Seeding Invoices, Payments Ledger, and Orders...');
    const pastDueDate = new Date(today);
    pastDueDate.setDate(pastDueDate.getDate() - 15);
    const pastDueDateStr = pastDueDate.toISOString().split('T')[0];

    // Invoice 1: Issued Unpaid for Acme Corp (₹2,36,000 Total, Balance ₹2,36,000)
    const [inv1] = await db.insert(invoices).values({
      invoiceNumber: 'INV-2026-001',
      quotationId: q1Id,
      customerId: acmeId,
      orderNumber: 'ORD-2026-501',
      status: 'ISSUED',
      currency: 'INR',
      subtotal: '225000.00',
      discountAmount: '25000.00',
      taxAmount: '36000.00', // 18% GST on 2,00,000 net
      totalAmount: '236000.00',
      amountPaid: '0.00',
      balanceDue: '236000.00',
      issueDate: issueDateStr,
      dueDate: expiryDateStr,
      notes: 'Commercial Tax Invoice for Annual Software License + Support.',
      createdById: financeId,
    }).onConflictDoNothing().returning();

    // Invoice 2: Partially Paid for Apex Cloud (₹5,57,550 Total, Paid ₹3,00,000, Balance ₹2,57,550)
    const [inv2] = await db.insert(invoices).values({
      invoiceNumber: 'INV-2026-002',
      quotationId: q5Id,
      customerId: apexId,
      orderNumber: 'ORD-2026-502',
      status: 'PARTIALLY_PAID',
      currency: 'INR',
      subtotal: '525000.00',
      discountAmount: '52500.00',
      taxAmount: '85050.00',
      totalAmount: '557550.00',
      amountPaid: '300000.00',
      balanceDue: '257550.00',
      issueDate: issueDateStr,
      dueDate: expiryDateStr,
      notes: 'Partial advance received via Wire transfer.',
      createdById: financeId,
    }).onConflictDoNothing().returning();

    // Invoice 3: Fully Paid for Acme Corp (₹1,77,000 Total, Paid ₹1,77,000, Balance ₹0.00)
    const [inv3] = await db.insert(invoices).values({
      invoiceNumber: 'INV-2026-003',
      customerId: acmeId,
      status: 'PAID',
      currency: 'INR',
      subtotal: '150000.00',
      discountAmount: '0.00',
      taxAmount: '27000.00',
      totalAmount: '177000.00',
      amountPaid: '177000.00',
      balanceDue: '0.00',
      issueDate: pastDueDateStr,
      dueDate: issueDateStr,
      notes: 'Fully settled and reconciled against Bank Statement.',
      createdById: financeId,
    }).onConflictDoNothing().returning();

    // Invoice 4: Overdue Invoice for Infosource Global (₹88,500 Total)
    await db.insert(invoices).values({
      invoiceNumber: 'INV-2026-004',
      customerId: infosourceId,
      status: 'OVERDUE',
      currency: 'INR',
      subtotal: '75000.00',
      discountAmount: '0.00',
      taxAmount: '13500.00',
      totalAmount: '88500.00',
      amountPaid: '0.00',
      balanceDue: '88500.00',
      issueDate: pastDueDateStr,
      dueDate: pastDueDateStr,
      notes: 'Payment reminder sent to Infosource procurement.',
      createdById: financeId,
    }).onConflictDoNothing();

    const inv1Id = inv1 ? inv1.id : (await db.select().from(invoices).where(eq(invoices.invoiceNumber, 'INV-2026-001')).limit(1))[0]?.id;
    const inv2Id = inv2 ? inv2.id : (await db.select().from(invoices).where(eq(invoices.invoiceNumber, 'INV-2026-002')).limit(1))[0]?.id;
    const inv3Id = inv3 ? inv3.id : (await db.select().from(invoices).where(eq(invoices.invoiceNumber, 'INV-2026-003')).limit(1))[0]?.id;

    // Seed Invoice line items
    if (inv1Id && swProdId && srvProdId) {
      await db.insert(invoiceItems).values([
        {
          invoiceId: inv1Id,
          productId: swProdId,
          productNameSnapshot: 'DealFlow360 Enterprise License (Annual)',
          skuSnapshot: 'DF360-ENT-YR',
          quantity: 1,
          unitPrice: '150000.00',
          discountPercent: '10.00',
          grossAmount: '150000.00',
          discountAmount: '15000.00',
          netAmount: '135000.00',
        },
        {
          invoiceId: inv1Id,
          productId: srvProdId,
          productNameSnapshot: '24/7 Dedicated Support & Premium SLA',
          skuSnapshot: 'SLA-PREM-247',
          quantity: 1,
          unitPrice: '75000.00',
          discountPercent: '13.33',
          grossAmount: '75000.00',
          discountAmount: '10000.00',
          netAmount: '65000.00',
        },
      ]).onConflictDoNothing();
    }

    if (inv2Id && hwProdId) {
      await db.insert(invoiceItems).values({
        invoiceId: inv2Id,
        productId: hwProdId,
        productNameSnapshot: 'High-Performance Edge Server X8',
        skuSnapshot: 'SRV-EDGE-X8',
        quantity: 1,
        unitPrice: '450000.00',
        discountPercent: '10.00',
        grossAmount: '450000.00',
        discountAmount: '45000.00',
        netAmount: '405000.00',
      }).onConflictDoNothing();
    }

    if (inv3Id && swProdId) {
      await db.insert(invoiceItems).values({
        invoiceId: inv3Id,
        productId: swProdId,
        productNameSnapshot: 'DealFlow360 Enterprise License (Annual)',
        skuSnapshot: 'DF360-ENT-YR',
        quantity: 1,
        unitPrice: '150000.00',
        discountPercent: '0.00',
        grossAmount: '150000.00',
        discountAmount: '0.00',
        netAmount: '150000.00',
      }).onConflictDoNothing();
    }

    // Payments Ledger
    if (inv2Id) {
      await db.insert(payments).values({
        paymentNumber: 'PAY-901001',
        invoiceId: inv2Id,
        customerId: apexId,
        amount: '300000.00',
        currency: 'INR',
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: 'NEFT-AXIS-99882211',
        status: 'COMPLETED',
        notes: 'Advance wire transfer 50% for cluster server delivery.',
        recordedById: financeId,
        paidAt: new Date(),
      }).onConflictDoNothing();
    }

    if (inv3Id) {
      await db.insert(payments).values({
        paymentNumber: 'PAY-901002',
        invoiceId: inv3Id,
        customerId: acmeId,
        amount: '177000.00',
        currency: 'INR',
        paymentMethod: 'CREDIT_CARD',
        transactionReference: 'CORP-VISA-440912',
        status: 'COMPLETED',
        notes: 'Corporate Credit Card instant settlement.',
        recordedById: financeId,
        paidAt: new Date(),
      }).onConflictDoNothing();
    }

    // Fulfillments & Orders for Customer & Operations
    if (q1Id) {
      const [ful1] = await db.insert(fulfillments).values({
        fulfillmentNumber: 'FUL-2026-001',
        quotationId: q1Id,
        status: 'ALLOCATED',
        allocatedAt: new Date(),
        createdById: repId,
      }).onConflictDoNothing().returning();

      if (ful1 && allWarehouses[0] && swProdId) {
        await db.insert(fulfillmentAllocations).values({
          fulfillmentId: ful1.id,
          warehouseId: allWarehouses[0].id,
          productId: swProdId,
          allocatedQuantity: 1,
          fulfilledQuantity: 0,
          status: 'ALLOCATED',
        }).onConflictDoNothing();
      }
    }

    if (q5Id) {
      const [ful2] = await db.insert(fulfillments).values({
        fulfillmentNumber: 'FUL-2026-002',
        quotationId: q5Id,
        status: 'FULFILLED',
        allocatedAt: new Date(),
        fulfilledAt: new Date(),
        createdById: repId,
      }).onConflictDoNothing().returning();

      if (ful2 && allWarehouses[1] && hwProdId) {
        await db.insert(fulfillmentAllocations).values({
          fulfillmentId: ful2.id,
          warehouseId: allWarehouses[1].id,
          productId: hwProdId,
          allocatedQuantity: 1,
          fulfilledQuantity: 1,
          status: 'FULFILLED',
        }).onConflictDoNothing();
      }
    }

    // 13. SaaS Subscription Plans
    console.log('[12/12] Seeding SaaS Subscription Plans...');
    const plansToSeed = [
      {
        name: 'Starter Tier',
        code: 'PLAN-STARTER',
        description: 'Ideal for small sales teams (up to 5 reps)',
        billingInterval: 'MONTHLY',
        price: '4999.00',
        features: ['Up to 5 Sales Reps', '100 Quotes / Month', 'Basic Analytics', 'Email Support'],
        isActive: true,
      },
      {
        name: 'Growth Enterprise',
        code: 'PLAN-GROWTH',
        description: 'For scaling B2B teams with margin governance & AI upsell',
        billingInterval: 'MONTHLY',
        price: '14999.00',
        features: ['Unlimited Reps', 'Multi-Tier Approvals', 'Revenue Analytics', 'AI Upsell Engine', 'Dedicated SLA'],
        isActive: true,
      },
      {
        name: 'Annual Scale Unlimited',
        code: 'PLAN-ANNUAL',
        description: 'Complete commercial operations suite billed annually with priority support',
        billingInterval: 'YEARLY',
        price: '149999.00',
        features: ['All Growth Features', 'Custom Invoicing & AR Aging', 'Full Logistics & Backorders', 'Custom Integrations', '99.9% SLA'],
        isActive: true,
      },
    ];

    for (const pl of plansToSeed) {
      await db.insert(subscriptionPlans).values(pl).onConflictDoNothing();
    }

    console.log('================================================================');
    console.log('🎉 DEALFLOW360 MULTI-ROLE DATABASE SEEDING COMPLETED (100%)');
    console.log('================================================================');
    console.log('All 5 roles now contain realistic, connected live dashboard data:');
    console.log('  1. ADMIN:         admin@dealflow360.io          / Password@123');
    console.log('     -> Users, Roles, Price Lists, Warehouses, Governance, System Settings');
    console.log('  2. SALES REP:     sales.rep@dealflow360.io      / Password@123');
    console.log('     -> 5 Active Quotes (Draft, Pending, Approved), Accounts, Pipeline');
    console.log('  3. SALES MANAGER: sales.manager@dealflow360.io  / Password@123');
    console.log('     -> Approvals Queue (QT-2026-103), Team Pipeline, Discount Alerts');
    console.log('  4. FINANCE:       finance@dealflow360.io        / Password@123');
    console.log('     -> Tier-2 Approvals (QT-2026-102), Dossiers, Invoices, Payments, AR Aging');
    console.log('  5. CUSTOMER:      customer@dealflow360.io       / Password@123');
    console.log('     -> Acme Portal: My Quotes, Active Orders, Tax Invoices, Receipts');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
}

// Self-executing when run directly via CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    pool.end();
    process.exit(0);
  });
}
