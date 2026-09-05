import { quotationsService } from '../src/modules/quotations/services/quotations.service.js';
import { priceListsService } from '../src/modules/price-lists/services/priceLists.service.js';
import { customerTiersService } from '../src/modules/customer-tiers/services/customerTiers.service.js';
import { categoriesService } from '../src/modules/categories/services/categories.service.js';
import { productsService } from '../src/modules/products/services/products.service.js';
import { customersService } from '../src/modules/customers/services/customers.service.js';
import { usersRepository } from '../src/modules/users/repositories/users.repository.js';
import { AuthUserContext } from '../src/modules/rbac/types/index.js';
import { Roles } from '../src/modules/rbac/constants/roles.js';
import { Permissions } from '../src/modules/rbac/constants/permissions.js';
import { pool } from '../src/database/db.js';

async function runPhase5Tests() {
  console.log('=== Starting Phase 5 Automated Verification Suite ===\n');

  try {
    // 0. Ensure test users
    console.log('[Test 0] Setting up mock user contexts...');
    const adminUser: AuthUserContext = {
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'admin@dealflow360.com',
      name: 'System Admin',
      roles: [Roles.ADMIN],
      permissions: Object.values(Permissions),
    };

    const salesRep1: AuthUserContext = {
      userId: '22222222-2222-4222-8222-222222222222',
      email: 'rep1@dealflow360.com',
      name: 'Sales Rep 1',
      roles: [Roles.SALES_REP],
      permissions: [
        Permissions.QUOTATION_CREATE,
        Permissions.QUOTATION_READ,
        Permissions.QUOTATION_UPDATE,
        Permissions.QUOTATION_DELETE,
      ],
    };

    const salesRep2: AuthUserContext = {
      userId: '33333333-3333-4333-8333-333333333333',
      email: 'rep2@dealflow360.com',
      name: 'Sales Rep 2',
      roles: [Roles.SALES_REP],
      permissions: [
        Permissions.QUOTATION_CREATE,
        Permissions.QUOTATION_READ,
        Permissions.QUOTATION_UPDATE,
      ],
    };

    // Ensure users exist in DB for FK constraints
    const existingAdmin = await usersRepository.findById(adminUser.userId);
    if (!existingAdmin) {
      await usersRepository.create({
        id: adminUser.userId,
        name: adminUser.name,
        email: adminUser.email,
        passwordHash: 'dummy-hash',
        isActive: true,
      });
    }

    const existingRep1 = await usersRepository.findById(salesRep1.userId);
    if (!existingRep1) {
      await usersRepository.create({
        id: salesRep1.userId,
        name: salesRep1.name,
        email: salesRep1.email,
        passwordHash: 'dummy-hash',
        isActive: true,
      });
    }

    const existingRep2 = await usersRepository.findById(salesRep2.userId);
    if (!existingRep2) {
      await usersRepository.create({
        id: salesRep2.userId,
        name: salesRep2.name,
        email: salesRep2.email,
        passwordHash: 'dummy-hash',
        isActive: true,
      });
    }

    // 1. Create Master Data
    console.log('[Test 1] Setting up master data for quotations...');
    const tier = await customerTiersService.createCustomerTier({
      name: `Q-Tier-${Date.now()}`,
      isActive: true,
    });

    const customer = await customersService.createCustomer({
      companyName: `Acme Corp ${Date.now()}`,
      contactName: 'John Doe',
      email: `john-${Date.now()}@acme.com`,
      customerTierId: tier.id,
      status: 'ACTIVE',
    });

    const category = await categoriesService.createCategory({
      name: `Q-Category-${Date.now()}`,
      isActive: true,
    });

    const product1 = await productsService.createProduct({
      name: `Enterprise Server ${Date.now()}`,
      sku: `SKU-SRV-${Date.now()}`,
      categoryId: category.id,
      productType: 'ONE_TIME',
      basePrice: '50000.00',
      currency: 'INR',
      isActive: true,
    });

    const product2 = await productsService.createProduct({
      name: `Cloud Support Package ${Date.now()}`,
      sku: `SKU-SUP-${Date.now()}`,
      categoryId: category.id,
      productType: 'SERVICE',
      basePrice: '10000.00',
      currency: 'INR',
      isActive: true,
    });

    const priceList = await priceListsService.createPriceList({
      name: `Q-PriceList-${Date.now()}`,
      currency: 'INR',
      isActive: true,
    });

    // Add Product 1 at custom price: ₹45,000 (Base is ₹50,000)
    await priceListsService.addProductPrice(priceList.id, {
      productId: product1.id,
      price: '45000.00',
    });

    console.log('✓ Master data and price lists initialized.\n');

    // 2. Quotation Monotonic Numbering & Sequence Non-Reuse
    console.log('[Test 2] Testing Monotonic Quotation Number Generation & Non-Reuse...');
    const q1 = await quotationsService.createQuotation(
      {
        customerId: customer.id,
        priceListId: priceList.id,
        issueDate: '2026-09-05',
        expiryDate: '2026-09-20',
        notes: 'Quotation 1',
      },
      salesRep1
    );
    console.log(`✓ Created Quotation 1: ${q1.quotationNumber} (Status: ${q1.status})`);

    const q2 = await quotationsService.createQuotation(
      {
        customerId: customer.id,
        priceListId: priceList.id,
        issueDate: '2026-09-05',
        expiryDate: '2026-09-20',
        notes: 'Quotation 2',
      },
      salesRep1
    );
    console.log(`✓ Created Quotation 2: ${q2.quotationNumber}`);

    // Cancel Quotation 2
    await quotationsService.cancelQuotation(q2.id, salesRep1);
    console.log(`✓ Cancelled Quotation 2: ${q2.quotationNumber}`);

    // Create Quotation 3 -> must have next sequence number, NOT reusing Q2
    const q3 = await quotationsService.createQuotation(
      {
        customerId: customer.id,
        priceListId: priceList.id,
        issueDate: '2026-09-05',
        expiryDate: '2026-09-20',
        notes: 'Quotation 3',
      },
      salesRep1
    );
    console.log(`✓ Created Quotation 3: ${q3.quotationNumber}`);

    const q1Num = parseInt(q1.quotationNumber.replace('QT-', ''), 10);
    const q2Num = parseInt(q2.quotationNumber.replace('QT-', ''), 10);
    const q3Num = parseInt(q3.quotationNumber.replace('QT-', ''), 10);

    if (q2Num !== q1Num + 1 || q3Num !== q2Num + 1) {
      throw new Error(`Quotation numbering failed monotonicity: ${q1.quotationNumber}, ${q2.quotationNumber}, ${q3.quotationNumber}`);
    }
    console.log('✓ Monotonic sequence and non-reuse verified.\n');

    // 3. Line Items, Price Resolution & Financial Calculations
    console.log('[Test 3] Testing Line Item Calculations & Price Resolution...');

    // Item 1: Product 1 (in price list at ₹45,000), qty = 10, discount = 10%
    // Gross: 45,000 * 10 = 450,000 | Discount: 45,000 | Net: 405,000
    const item1Res = await quotationsService.addItem(
      q1.id,
      {
        productId: product1.id,
        quantity: 10,
        discountPercent: '10.00',
      },
      salesRep1
    );

    if (
      item1Res.item.unitPrice !== '45000.00' ||
      item1Res.item.grossAmount !== '450000.00' ||
      item1Res.item.discountAmount !== '45000.00' ||
      item1Res.item.netAmount !== '405000.00'
    ) {
      throw new Error(`Item 1 calculations mismatch: ${JSON.stringify(item1Res.item)}`);
    }

    if (
      item1Res.quotation.subtotal !== '450000.00' ||
      item1Res.quotation.discountAmount !== '45000.00' ||
      item1Res.quotation.totalAmount !== '405000.00'
    ) {
      throw new Error(`Quotation 1 header totals mismatch: ${JSON.stringify(item1Res.quotation)}`);
    }
    console.log('✓ Item 1 added with price list resolution & exact math.');

    // Item 2: Product 2 (missing from price list -> fallback to base price ₹10,000), qty = 2, discount = 0%
    // Gross: 10,000 * 2 = 20,000 | Discount: 0 | Net: 20,000
    // Header subtotal: 470,000 | discount: 45,000 | total: 425,000
    const item2Res = await quotationsService.addItem(
      q1.id,
      {
        productId: product2.id,
        quantity: 2,
        discountPercent: '0.00',
      },
      salesRep1
    );

    if (
      item2Res.item.unitPrice !== '10000.00' ||
      item2Res.item.grossAmount !== '20000.00' ||
      item2Res.item.discountAmount !== '0.00' ||
      item2Res.item.netAmount !== '20000.00'
    ) {
      throw new Error(`Item 2 calculations mismatch: ${JSON.stringify(item2Res.item)}`);
    }

    if (
      item2Res.quotation.subtotal !== '470000.00' ||
      item2Res.quotation.discountAmount !== '45000.00' ||
      item2Res.quotation.totalAmount !== '425000.00'
    ) {
      throw new Error(`Quotation totals after Item 2 mismatch: ${JSON.stringify(item2Res.quotation)}`);
    }
    console.log('✓ Item 2 added with base price fallback & aggregated header totals.\n');

    // 4. Update Line Item & Recalculate
    console.log('[Test 4] Testing Item Update & Totals Recalculation...');
    // Update Item 1: qty = 20, discount = 15%
    // Gross: 45,000 * 20 = 900,000 | Discount: 135,000 | Net: 765,000
    // Total subtotal: 900,000 + 20,000 = 920,000 | discount: 135,000 | total: 785,000
    const updatedItem1Res = await quotationsService.updateItem(
      q1.id,
      item1Res.item.id,
      {
        quantity: 20,
        discountPercent: '15.00',
      },
      salesRep1
    );

    if (
      updatedItem1Res.item.grossAmount !== '900000.00' ||
      updatedItem1Res.item.discountAmount !== '135000.00' ||
      updatedItem1Res.item.netAmount !== '765000.00'
    ) {
      throw new Error(`Updated item 1 calculations mismatch: ${JSON.stringify(updatedItem1Res.item)}`);
    }

    if (
      updatedItem1Res.quotation.subtotal !== '920000.00' ||
      updatedItem1Res.quotation.discountAmount !== '135000.00' ||
      updatedItem1Res.quotation.totalAmount !== '785000.00'
    ) {
      throw new Error(`Updated quotation totals mismatch: ${JSON.stringify(updatedItem1Res.quotation)}`);
    }
    console.log('✓ Item 1 updated and quotation totals correctly recalculated.\n');

    // 5. Remove Item & Recalculate
    console.log('[Test 5] Testing Item Deletion & Totals Recalculation...');
    const deleteItem2Res = await quotationsService.deleteItem(q1.id, item2Res.item.id, salesRep1);
    if (
      deleteItem2Res.quotation.subtotal !== '900000.00' ||
      deleteItem2Res.quotation.discountAmount !== '135000.00' ||
      deleteItem2Res.quotation.totalAmount !== '765000.00'
    ) {
      throw new Error(`Totals after deletion mismatch: ${JSON.stringify(deleteItem2Res.quotation)}`);
    }
    console.log('✓ Item 2 removed and quotation totals adjusted.\n');

    // 6. Security & Ownership Enforcement
    console.log('[Test 6] Testing Ownership & Immutability Enforcement...');
    // Sales Rep 2 attempts to edit Sales Rep 1's quotation -> must throw ForbiddenError
    let ownershipBlocked = false;
    try {
      await quotationsService.updateQuotation(q1.id, { notes: 'Hacked by Rep 2' }, salesRep2);
    } catch {
      ownershipBlocked = true;
    }
    if (!ownershipBlocked) {
      throw new Error('Security vulnerability: Sales Rep 2 was able to edit Sales Rep 1 quotation!');
    }
    console.log('✓ Sales Rep cross-user edit blocked (ForbiddenError).');

    // Admin can edit Sales Rep 1 quotation
    await quotationsService.updateQuotation(q1.id, { notes: 'Admin update allowed' }, adminUser);
    console.log('✓ Admin bypass verified for quotation management.');

    // Cancelled quotation immutability
    let cancelledModBlocked = false;
    try {
      await quotationsService.addItem(
        q2.id,
        { productId: product1.id, quantity: 1, discountPercent: '0.00' },
        salesRep1
      );
    } catch {
      cancelledModBlocked = true;
    }
    if (!cancelledModBlocked) {
      throw new Error('Immutability violated: Added item to cancelled quotation!');
    }
    console.log('✓ Cancelled quotation immutability enforced (BadRequestError).\n');

    console.log('========================================');
    console.log('ALL PHASE 5 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ Phase 5 Test Suite Failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase5Tests();
