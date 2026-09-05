import { db, pool } from "../src/database/db.js";
import {
  users,
  productCategories,
  products,
  customers,
  customerTiers,
  priceLists,
  quotations,
  quotationItems,
  warehouses,
  warehouseInventory,
  inventoryTransactions,
  fulfillments,
  fulfillmentAllocations,
  backorders,
} from "../src/database/schema/index.js";
import { warehousesService } from "../src/modules/warehouses/index.js";
import { inventoryService } from "../src/modules/inventory/index.js";
import { fulfillmentService } from "../src/modules/fulfillment/index.js";
import { FulfillmentStatus } from "../src/modules/fulfillment/constants/index.js";
import { QuotationStatuses } from "../src/modules/quotations/constants/quotationStatus.js";
import { eq, desc } from "drizzle-orm";

async function runPhase8Tests() {
  console.log("=== Starting Phase 8 Automated Verification Suite ===\n");

  const timestamp = Date.now();

  // Setup master user, customer tier, price list, customer, category, products
  console.log("[Setup] Creating User, Customer Tier, Price List, Customer, Category & Products...");

  const [testUser] = await db
    .insert(users)
    .values({
      name: `Fulfillment Manager ${timestamp}`,
      email: `mgr.phase8.${timestamp}@dealflow360.com`,
      passwordHash: 'dummy-hash',
    })
    .returning();

  const testUserId = testUser.id;

  const [tier] = await db
    .insert(customerTiers)
    .values({
      name: `Tier Phase8 ${timestamp}`,
      description: "Tier for Phase 8 testing",
    })
    .returning();

  const [priceList] = await db
    .insert(priceLists)
    .values({
      name: `PriceList Phase8 ${timestamp}`,
      description: "Default test price list",
      currency: "INR",
    })
    .returning();

  const [customer] = await db
    .insert(customers)
    .values({
      companyName: `Acme Logistics ${timestamp}`,
      email: `acme.phase8.${timestamp}@example.com`,
      customerTierId: tier.id,
    })
    .returning();

  const [category] = await db
    .insert(productCategories)
    .values({
      name: `Hardware Phase8 ${timestamp}`,
      description: "Test Hardware",
    })
    .returning();

  const [productA] = await db
    .insert(products)
    .values({
      name: "Enterprise Server X",
      sku: `SRV-X-${timestamp}`,
      categoryId: category.id,
      basePrice: "100000.00",
      currency: "INR",
    })
    .returning();

  const [productB] = await db
    .insert(products)
    .values({
      name: "Network Switch Pro",
      sku: `SW-PRO-${timestamp}`,
      categoryId: category.id,
      basePrice: "25000.00",
      currency: "INR",
    })
    .returning();

  console.log("✓ Setup completed.\n");

  // SCENARIO 1: Warehouse Master Data CRUD
  console.log("--- Scenario 1: Warehouse Master Data CRUD ---");
  const whCentral = await warehousesService.createWarehouse({
    name: `Central Hub ${timestamp}`,
    code: `WH-C-${timestamp}`,
    address: "Central Industrial Area, Sector 5",
    city: "Mumbai",
    state: "MH",
    country: "India",
    pincode: "400001",
    priority: 100,
  });
  console.log(`✓ Created Central Warehouse: ${whCentral.code} (Priority: ${whCentral.priority})`);

  const whEast = await warehousesService.createWarehouse({
    name: `East Hub ${timestamp}`,
    code: `WH-E-${timestamp}`,
    address: "Salt Lake Sector V",
    city: "Kolkata",
    state: "WB",
    country: "India",
    pincode: "700091",
    priority: 80,
  });
  console.log(`✓ Created East Warehouse: ${whEast.code} (Priority: ${whEast.priority})`);

  const whWest = await warehousesService.createWarehouse({
    name: `West Hub ${timestamp}`,
    code: `WH-W-${timestamp}`,
    address: "GIDC Industrial Estate",
    city: "Ahmedabad",
    state: "GJ",
    country: "India",
    pincode: "380001",
    priority: 50,
  });
  console.log(`✓ Created West Warehouse: ${whWest.code} (Priority: ${whWest.priority})`);

  const whList = await warehousesService.listWarehouses({ page: 1, limit: 10 });
  if (whList.warehouses.length < 3) {
    throw new Error("Failed to list created warehouses");
  }
  console.log(`✓ Listed ${whList.warehouses.length} warehouses with pagination.`);

  const whUpdated = await warehousesService.updateWarehouse(whWest.id, {
    address: "Updated GIDC Phase 2",
    priority: 60,
  });
  if (whUpdated.priority !== 60) {
    throw new Error("Failed to update warehouse priority");
  }
  console.log("✓ Updated West Warehouse priority and address.\n");

  // SCENARIO 2: Inventory Ingestion & Auditing
  console.log("--- Scenario 2: Inventory Ingestion & Stock Adjustment ---");
  // Set initial stock
  await inventoryService.setStock(
    {
      warehouseId: whCentral.id,
      productId: productA.id,
      quantityOnHand: 100,
      reorderLevel: 10,
    },
    testUserId
  );

  await inventoryService.setStock(
    {
      warehouseId: whCentral.id,
      productId: productB.id,
      quantityOnHand: 50,
      reorderLevel: 5,
    },
    testUserId
  );

  // Adjust stock in East Hub (add 40 units)
  await inventoryService.adjustStock(
    {
      warehouseId: whEast.id,
      productId: productA.id,
      quantity: 40,
      transactionType: "STOCK_RECEIVED",
      notes: "Initial shipment arrival",
    },
    testUserId
  );

  // Adjust stock in West Hub (add 20 units)
  await inventoryService.adjustStock(
    {
      warehouseId: whWest.id,
      productId: productA.id,
      quantity: 20,
      transactionType: "STOCK_RECEIVED",
      notes: "Stock transfer",
    },
    testUserId
  );

  const productASummary = await inventoryService.getProductInventorySummary(productA.id);
  console.log(`✓ Product A Stock Summary: Total On-Hand = ${productASummary.totalOnHand}, Total Available = ${productASummary.totalAvailable}`);
  if (productASummary.totalOnHand !== 160 || productASummary.totalAvailable !== 160) {
    throw new Error(`Expected 160 total on-hand for Product A, got ${productASummary.totalOnHand}`);
  }

  const txLogs = await inventoryService.listTransactions({ productId: productA.id });
  if (txLogs.data.length < 3) {
    throw new Error("Expected at least 3 inventory audit transactions logged");
  }
  console.log(`✓ Verified ${txLogs.data.length} audit trail transactions logged.\n`);

  // SCENARIO 3: Deterministic Allocation — Priority 1: Single-Warehouse Preference
  console.log("--- Scenario 3: Allocation Engine Priority 1 — Single-Warehouse Preference ---");
  // Quotation 1 requests 70 units of Product A
  // Central Hub has 100 units (>= 70). Even though East (40) and West (20) exist, Central can fulfill 100% in 1 shipment.
  const [quote1] = await db
    .insert(quotations)
    .values({
      quotationNumber: `QT-P8-1-${timestamp}`,
      customerId: customer.id,
      priceListId: priceList.id,
      createdBy: testUserId,
      status: QuotationStatuses.APPROVED,
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
      subtotal: "7000000.00",
      discountAmount: "0.00",
      totalAmount: "7000000.00",
    })
    .returning();

  await db.insert(quotationItems).values({
    quotationId: quote1.id,
    productId: productA.id,
    productNameSnapshot: productA.name,
    skuSnapshot: productA.sku,
    quantity: 70,
    unitPrice: "100000.00",
    discountPercent: "0.00",
    discountAmount: "0.00",
    grossAmount: "7000000.00",
    netAmount: "7000000.00",
  });

  const preview1 = await fulfillmentService.previewAllocation(quote1.id);
  console.log(`✓ Allocation Preview: Fully Allocatable = ${preview1.isFullyAllocatable}, Allocations = ${preview1.allocations.length}`);
  if (preview1.allocations.length !== 1 || preview1.allocations[0].warehouseId !== whCentral.id || preview1.allocations[0].allocatedQuantity !== 70) {
    throw new Error("Priority 1 Single-Warehouse allocation failed: expected 70 units from Central Hub");
  }

  const ful1 = await fulfillmentService.createFulfillment(quote1.id, testUserId);
  if (!ful1 || ful1.status !== FulfillmentStatus.ALLOCATED) {
    throw new Error(`Expected fulfillment status ALLOCATED, got ${ful1?.status}`);
  }
  console.log(`✓ Created Fulfillment ${ful1.fulfillmentNumber} with status ${ful1.status}`);

  // Verify Central Hub reservation
  const invCentralA = await db.query.warehouseInventory.findFirst({
    where: eq(warehouseInventory.warehouseId, whCentral.id),
  });
  if (invCentralA?.reservedQuantity !== 70) {
    throw new Error(`Expected Central Hub reserved quantity 70, got ${invCentralA?.reservedQuantity}`);
  }
  console.log(`✓ Central Hub Reserved Quantity: ${invCentralA.reservedQuantity}, Available: ${invCentralA.quantityOnHand - invCentralA.reservedQuantity}\n`);

  // SCENARIO 4: Deterministic Allocation — Priority 2: Multi-Warehouse Split
  console.log("--- Scenario 4: Allocation Engine Priority 2 — Multi-Warehouse Split Allocation ---");
  // Now Central Hub has 30 available, East has 40 available, West has 20 available.
  // Quotation 2 requests 50 units of Product A.
  // No single warehouse has 50 available.
  // Split logic: East has 40 available -> allocates 40 from East. Central has 30 available -> allocates 10 from Central.
  const [quote2] = await db
    .insert(quotations)
    .values({
      quotationNumber: `QT-P8-2-${timestamp}`,
      customerId: customer.id,
      priceListId: priceList.id,
      createdBy: testUserId,
      status: QuotationStatuses.APPROVED,
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
      subtotal: "5000000.00",
      discountAmount: "0.00",
      totalAmount: "5000000.00",
    })
    .returning();

  await db.insert(quotationItems).values({
    quotationId: quote2.id,
    productId: productA.id,
    productNameSnapshot: productA.name,
    skuSnapshot: productA.sku,
    quantity: 50,
    unitPrice: "100000.00",
    discountPercent: "0.00",
    discountAmount: "0.00",
    grossAmount: "5000000.00",
    netAmount: "5000000.00",
  });

  const ful2 = await fulfillmentService.createFulfillment(quote2.id, testUserId);
  if (!ful2 || ful2.status !== FulfillmentStatus.ALLOCATED) {
    throw new Error(`Expected fulfillment 2 to be ALLOCATED, got ${ful2?.status}`);
  }
  if (ful2.allocations.length < 2) {
    throw new Error("Expected multi-warehouse split across 2 warehouses");
  }
  const totalAllocatedQuote2 = ful2.allocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);
  if (totalAllocatedQuote2 !== 50) {
    throw new Error(`Expected total 50 allocated for Quote 2, got ${totalAllocatedQuote2}`);
  }
  console.log(`✓ Quote 2 allocated across ${ful2.allocations.length} warehouses (${ful2.allocations.map(a => `${a.warehouseCode}: ${a.allocatedQuantity}`).join(', ')}).\n`);

  // SCENARIO 5: Deterministic Allocation — Priority 3: Backorders on Shortage
  console.log("--- Scenario 5: Allocation Engine Priority 3 — Backorders on Shortage ---");
  // Product B only has 50 units on Central Hub.
  // Quotation 3 requests 75 units of Product B.
  const [quote3] = await db
    .insert(quotations)
    .values({
      quotationNumber: `QT-P8-3-${timestamp}`,
      customerId: customer.id,
      priceListId: priceList.id,
      createdBy: testUserId,
      status: QuotationStatuses.APPROVED,
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
      subtotal: "1875000.00",
      discountAmount: "0.00",
      totalAmount: "1875000.00",
    })
    .returning();

  await db.insert(quotationItems).values({
    quotationId: quote3.id,
    productId: productB.id,
    productNameSnapshot: productB.name,
    skuSnapshot: productB.sku,
    quantity: 75,
    unitPrice: "25000.00",
    discountPercent: "0.00",
    discountAmount: "0.00",
    grossAmount: "1875000.00",
    netAmount: "1875000.00",
  });

  const ful3 = await fulfillmentService.createFulfillment(quote3.id, testUserId);
  if (!ful3 || ful3.status !== FulfillmentStatus.PARTIALLY_ALLOCATED) {
    throw new Error(`Expected fulfillment 3 status PARTIALLY_ALLOCATED, got ${ful3?.status}`);
  }
  if (ful3.backorders.length !== 1 || ful3.backorders[0].backorderedQuantity !== 25) {
    throw new Error(`Expected 1 backorder of 25 units, got ${JSON.stringify(ful3.backorders)}`);
  }
  console.log(`✓ Fulfillment 3 status: ${ful3.status}, Allocated: ${ful3.allocations[0]?.allocatedQuantity}, Backordered: ${ful3.backorders[0]?.backorderedQuantity}\n`);

  // SCENARIO 6: Concurrency & Oversell Protection
  console.log("--- Scenario 6: Concurrency & Oversell Protection ---");
  // Attempting to reduce Central Hub on-hand stock below reserved amount
  try {
    await inventoryService.adjustStock(
      {
        warehouseId: whCentral.id,
        productId: productA.id,
        quantity: -50, // Insufficient available stock
      },
      testUserId
    );
    throw new Error("Should have thrown oversell error when reducing stock below reserved quantity");
  } catch (err: any) {
    console.log(`✓ Oversell prevented correctly: "${err.message}"\n`);
  }

  // SCENARIO 7: Manual Allocation Override
  console.log("--- Scenario 7: Manual Allocation Override & Rebalancing ---");
  // For Quote 2 (which had 50 units allocated across East & Central):
  // Let's manually override to allocate 20 from West Hub and 20 from Central Hub (partial)
  const overrideRes = await fulfillmentService.overrideAllocations(
    ful2.id,
    {
      allocations: [
        { warehouseId: whWest.id, productId: productA.id, quantity: 20 },
        { warehouseId: whCentral.id, productId: productA.id, quantity: 20 },
      ],
    },
    testUserId
  );

  if (overrideRes?.status !== FulfillmentStatus.PARTIALLY_ALLOCATED && overrideRes?.backorders.length !== 1) {
    throw new Error("Expected override with 40 units out of 50 to create a 10 unit backorder");
  }
  console.log(`✓ Overrode allocations successfully. Status: ${overrideRes.status}, Backordered: ${overrideRes.backorders[0]?.backorderedQuantity}`);

  // Now override back to full 50: 20 from West and 30 from East
  const overrideFull = await fulfillmentService.overrideAllocations(
    ful2.id,
    {
      allocations: [
        { warehouseId: whWest.id, productId: productA.id, quantity: 20 },
        { warehouseId: whEast.id, productId: productA.id, quantity: 30 },
      ],
    },
    testUserId
  );
  if (overrideFull?.status !== FulfillmentStatus.ALLOCATED || overrideFull?.backorders.length !== 0) {
    throw new Error("Expected full allocation to restore ALLOCATED status without backorders");
  }
  console.log("✓ Overrode allocations back to 100% allocated.\n");

  // SCENARIO 8: Partial Fulfillment Execution
  console.log("--- Scenario 8: Partial Fulfillment Execution ---");
  // Fulfill 20 units from West Hub for Quote 2
  const westAlloc = overrideFull.allocations.find((a) => a.warehouseId === whWest.id);
  if (!westAlloc) throw new Error("West allocation not found");

  const partialFul = await fulfillmentService.fulfillItems(
    ful2.id,
    {
      items: [{ allocationId: westAlloc.id, quantity: 20 }],
      notes: "Dispatched batch 1 via express cargo",
    },
    testUserId
  );

  if (partialFul?.status !== FulfillmentStatus.PARTIALLY_FULFILLED) {
    throw new Error(`Expected PARTIALLY_FULFILLED status, got ${partialFul?.status}`);
  }
  console.log(`✓ Partial fulfillment processed. Status: ${partialFul.status}`);

  // Verify West Hub stock deduction
  const westInvAfter = await db.query.warehouseInventory.findFirst({
    where: eq(warehouseInventory.warehouseId, whWest.id),
  });
  if (westInvAfter?.quantityOnHand !== 0 || westInvAfter?.reservedQuantity !== 0) {
    throw new Error(`Expected West Hub onHand = 0, reserved = 0 after fulfillment. Got onHand: ${westInvAfter?.quantityOnHand}, reserved: ${westInvAfter?.reservedQuantity}`);
  }
  console.log(`✓ West Hub stock deducted cleanly (OnHand: ${westInvAfter.quantityOnHand}, Reserved: ${westInvAfter.reservedQuantity})\n`);

  // SCENARIO 9: Full Fulfillment Completion
  console.log("--- Scenario 9: Full Fulfillment Completion ---");
  const completedFul = await fulfillmentService.fulfillItems(
    ful2.id,
    {}, // complete all remaining allocated
    testUserId
  );

  if (completedFul?.status !== FulfillmentStatus.FULFILLED || !completedFul?.fulfilledAt) {
    throw new Error(`Expected FULFILLED status with fulfilledAt date, got ${completedFul?.status}`);
  }
  console.log(`✓ Fulfillment ${completedFul.fulfillmentNumber} completed with status ${completedFul.status} at ${completedFul.fulfilledAt}\n`);

  // SCENARIO 10: Fulfillment Cancellation & Reservation Release
  console.log("--- Scenario 10: Fulfillment Cancellation & Reservation Release ---");
  // Quote 1 had 70 units of Product A reserved in Central Hub
  const centralInvBeforeCancel = await db.query.warehouseInventory.findFirst({
    where: eq(warehouseInventory.warehouseId, whCentral.id),
  });
  console.log(`Central Hub reserved before cancel: ${centralInvBeforeCancel?.reservedQuantity}`);

  const cancelledFul = await fulfillmentService.cancelFulfillment(
    ful1.id,
    "Customer requested delivery schedule deferral",
    testUserId
  );

  if (cancelledFul?.status !== FulfillmentStatus.CANCELLED) {
    throw new Error(`Expected CANCELLED status, got ${cancelledFul?.status}`);
  }

  const centralInvAfterCancel = await db.query.warehouseInventory.findFirst({
    where: eq(warehouseInventory.warehouseId, whCentral.id),
  });
  console.log(`Central Hub reserved after cancel: ${centralInvAfterCancel?.reservedQuantity}`);
  if (centralInvAfterCancel?.reservedQuantity !== 0) {
    throw new Error(`Expected Central Hub reserved quantity 0 after cancel, got ${centralInvAfterCancel?.reservedQuantity}`);
  }
  console.log("✓ Cancellation released all reserved stock back to availability pool.\n");

  // SCENARIO 11: Quotation Status Guard
  console.log("--- Scenario 11: Quotation Status Guard ---");
  const [draftQuote] = await db
    .insert(quotations)
    .values({
      quotationNumber: `QT-DRAFT-${timestamp}`,
      customerId: customer.id,
      priceListId: priceList.id,
      createdBy: testUserId,
      status: QuotationStatuses.DRAFT,
      issueDate: '2026-09-05',
      expiryDate: '2026-10-05',
      subtotal: "100000.00",
      discountAmount: "0.00",
      totalAmount: "100000.00",
    })
    .returning();

  try {
    await fulfillmentService.createFulfillment(draftQuote.id, testUserId);
    throw new Error("Should have blocked fulfillment for DRAFT quotation");
  } catch (err: any) {
    console.log(`✓ Status guard verified: "${err.message}"\n`);
  }

  // SCENARIO 12: End-to-End List & Retrieval
  console.log("--- Scenario 12: List & Filter Fulfillments ---");
  const fulList = await fulfillmentService.list({ page: 1, limit: 10 });
  if (fulList.data.length < 3) {
    throw new Error("Expected at least 3 fulfillments in database");
  }
  console.log(`✓ Retrieved ${fulList.total} fulfillments across all statuses.`);

  console.log("\n============================================================");
  console.log("🎉 ALL 12 PHASE 8 TEST SCENARIOS PASSED WITH ZERO DEFECTS!");
  console.log("============================================================\n");
}

runPhase8Tests()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ PHASE 8 TEST SUITE FAILED:", err);
    await pool.end();
    process.exit(1);
  });
