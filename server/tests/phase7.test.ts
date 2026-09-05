import { db } from "../src/database/db.js";
import {
  customerTiers,
  productCategories,
  products,
  customers,
  priceLists,
  priceListItems,
  quotations,
  quotationItems,
  quotationApprovals,
  recommendationRules,
  recommendationEvents,
} from "../src/database/schema/index.js";
import { recommendationRulesService } from "../src/modules/recommendations/services/recommendationRules.service.js";
import { recommendationEngineService } from "../src/modules/recommendations/services/recommendationEngine.service.js";
import { recommendationAcceptanceService } from "../src/modules/recommendations/services/recommendationAcceptance.service.js";
import { quotationsService } from "../src/modules/quotations/services/quotations.service.js";
import { approvalRoutingService } from "../src/modules/discount-governance/services/approvalRouting.service.js";
import { RecommendationTypes } from "../src/modules/recommendations/constants/recommendationTypes.js";
import { RecommendationPriorities } from "../src/modules/recommendations/constants/recommendationPriorities.js";
import { RecommendationEventTypes } from "../src/modules/recommendations/constants/recommendationEvents.js";
import { QuotationStatuses } from "../src/modules/quotations/constants/quotationStatus.js";
import { ApprovalStatuses } from "../src/modules/discount-governance/constants/approvalStatus.js";
import { Roles } from "../src/modules/rbac/constants/roles.js";
import { AuthUserContext } from "../src/modules/rbac/types/index.js";
import { eq } from "drizzle-orm";

async function runPhase7Tests() {
  console.log("=== Starting Phase 7 Automated Verification Suite ===\n");

  // Contexts
  const salesRepUserA: AuthUserContext = {
    userId: "11111111-1111-1111-1111-111111111111",
    name: "Sales Rep Alice",
    email: "rep.alice@dealflow360.com",
    roles: [Roles.SALES_REP],
    permissions: [],
  };

  const salesRepUserB: AuthUserContext = {
    userId: "11111111-1111-1111-1111-222222222222",
    name: "Sales Rep Bob",
    email: "rep.bob@dealflow360.com",
    roles: [Roles.SALES_REP],
    permissions: [],
  };

  const salesManagerUser: AuthUserContext = {
    userId: "22222222-2222-2222-2222-222222222222",
    name: "Manager Bob",
    email: "manager.bob@dealflow360.com",
    roles: [Roles.SALES_MANAGER],
    permissions: [],
  };

  const adminUser: AuthUserContext = {
    userId: "44444444-4444-4444-4444-444444444444",
    name: "Admin Super",
    email: "admin.super@dealflow360.com",
    roles: [Roles.ADMIN],
    permissions: [],
  };

  // 1. Setup Master Data
  console.log("[Setup] Configuring Categories, Products, and Price Lists...");

  const [hardwareCat] = await db
    .insert(productCategories)
    .values({
      name: `Hardware P7 ${Date.now()}`,
      description: "Hardware Devices",
    })
    .returning();

  const [accessoriesCat] = await db
    .insert(productCategories)
    .values({
      name: `Accessories P7 ${Date.now()}`,
      description: "Accessories",
    })
    .returning();

  const [servicesCat] = await db
    .insert(productCategories)
    .values({
      name: `Services P7 ${Date.now()}`,
      description: "Services and Warranties",
    })
    .returning();

  // Products
  const [prodLaptop] = await db
    .insert(products)
    .values({
      name: "Standard Laptop 15",
      sku: `LAP-STD-${Date.now()}`,
      categoryId: hardwareCat.id,
      basePrice: "60000.00",
      currency: "INR",
      isActive: true,
    })
    .returning();

  const [prodEnterpriseLaptop] = await db
    .insert(products)
    .values({
      name: "Enterprise Laptop 15 Pro",
      sku: `LAP-ENT-${Date.now()}`,
      categoryId: hardwareCat.id,
      basePrice: "120000.00",
      currency: "INR",
      isActive: true,
    })
    .returning();

  const [prodBag] = await db
    .insert(products)
    .values({
      name: "Premium Laptop Bag",
      sku: `BAG-${Date.now()}`,
      categoryId: accessoriesCat.id,
      basePrice: "3000.00",
      currency: "INR",
      isActive: true,
    })
    .returning();

  const [prodWarranty] = await db
    .insert(products)
    .values({
      name: "3-Year Comprehensive Warranty",
      sku: `WAR-3YR-${Date.now()}`,
      categoryId: servicesCat.id,
      basePrice: "10000.00",
      currency: "INR",
      isActive: true,
    })
    .returning();

  const [prodServer] = await db
    .insert(products)
    .values({
      name: "Rack Server R740",
      sku: `SRV-R740-${Date.now()}`,
      categoryId: hardwareCat.id,
      basePrice: "250000.00",
      currency: "INR",
      isActive: true,
    })
    .returning();

  const [prodPrinter] = await db
    .insert(products)
    .values({
      name: "Workgroup Laser Printer",
      sku: `PRN-LSR-${Date.now()}`,
      categoryId: hardwareCat.id,
      basePrice: "45000.00",
      currency: "INR",
      isActive: true,
    })
    .returning();

  const [prodToner] = await db
    .insert(products)
    .values({
      name: "High Yield Black Toner",
      sku: `TNR-HY-${Date.now()}`,
      categoryId: accessoriesCat.id,
      basePrice: "8000.00",
      currency: "INR",
      isActive: true,
    })
    .returning();

  const [prodInactive] = await db
    .insert(products)
    .values({
      name: "Legacy Docking Station (Deprecated)",
      sku: `DOC-LEG-${Date.now()}`,
      categoryId: accessoriesCat.id,
      basePrice: "5000.00",
      currency: "INR",
      isActive: false, // Inactive
    })
    .returning();

  // Price List with special warranty price
  const [enterprisePriceList] = await db
    .insert(priceLists)
    .values({
      name: `Enterprise Agreement ${Date.now()}`,
      currency: "INR",
      isDefault: false,
      isActive: true,
    })
    .returning();

  await db.insert(priceListItems).values({
    priceListId: enterprisePriceList.id,
    productId: prodWarranty.id,
    price: "7500.00", // Discounted special price from base 10000
  });

  // Customer
  const [tierA] = await db
    .insert(customerTiers)
    .values({
      name: `Tier A ${Date.now()}`,
    })
    .returning();

  const [customerA] = await db
    .insert(customers)
    .values({
      companyName: "Acme Corporation",
      contactName: "Alice Smith",
      email: `alice.${Date.now()}@acme.com`,
      customerTierId: tierA.id,
    })
    .returning();

  console.log(
    "✓ Master data, products, categories, and price lists initialized.\n",
  );

  // =========================================================================
  // SCENARIO 1 & 2 — Recommendation Rules Configuration (Cross-Sell & Upsell)
  // =========================================================================
  console.log("[Scenario 1 & 2] Configuring Recommendation Rules...");

  // Rule 1: Laptop -> Bag (CROSS_SELL, HIGH, qty: 1)
  const ruleLaptopBag = await recommendationRulesService.createRule({
    sourceProductId: prodLaptop.id,
    recommendedProductId: prodBag.id,
    recommendationType: RecommendationTypes.CROSS_SELL,
    priority: RecommendationPriorities.HIGH,
    defaultQuantity: 1,
    description: "Complementary protective bag for laptops",
  });

  // Rule 2: Standard Laptop -> Enterprise Laptop (UPSELL, HIGH)
  const ruleLaptopUpsell = await recommendationRulesService.createRule({
    sourceProductId: prodLaptop.id,
    recommendedProductId: prodEnterpriseLaptop.id,
    recommendationType: RecommendationTypes.UPSELL,
    priority: RecommendationPriorities.HIGH,
    defaultQuantity: 1,
    description: "Upgrade to enterprise performance laptop",
  });

  // Rule 3: Laptop -> Inactive Product (CROSS_SELL)
  await recommendationRulesService.createRule({
    sourceProductId: prodLaptop.id,
    recommendedProductId: prodInactive.id,
    recommendationType: RecommendationTypes.CROSS_SELL,
    priority: RecommendationPriorities.LOW,
  });

  // Rule 4: Laptop -> Warranty (CROSS_SELL, MEDIUM)
  const ruleLaptopWarranty = await recommendationRulesService.createRule({
    sourceProductId: prodLaptop.id,
    recommendedProductId: prodWarranty.id,
    recommendationType: RecommendationTypes.CROSS_SELL,
    priority: RecommendationPriorities.MEDIUM,
    defaultQuantity: 1,
  });

  // Rule 5: Server -> Warranty (CROSS_SELL, HIGH)
  const ruleServerWarranty = await recommendationRulesService.createRule({
    sourceProductId: prodServer.id,
    recommendedProductId: prodWarranty.id,
    recommendationType: RecommendationTypes.CROSS_SELL,
    priority: RecommendationPriorities.HIGH,
    defaultQuantity: 1,
  });

  // Rule 6: Printer -> Toner (CROSS_SELL, MEDIUM, qty: 2)
  const rulePrinterToner = await recommendationRulesService.createRule({
    sourceProductId: prodPrinter.id,
    recommendedProductId: prodToner.id,
    recommendationType: RecommendationTypes.CROSS_SELL,
    priority: RecommendationPriorities.MEDIUM,
    defaultQuantity: 2,
    description: "Replacement toner cartridges",
  });

  console.log("✓ Recommendation rules created successfully.\n");

  // =========================================================================
  // SCENARIO 3 — Basic Cross-Sell and Upsell Recommendations on Quotation
  // =========================================================================
  console.log("[Scenario 3] Testing Quotation Recommendations Retrieval...");

  const quote1 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: enterprisePriceList.id,
      currency: "INR",
      issueDate: "2026-09-05",
      expiryDate: "2026-10-05",
    },
    salesRepUserA,
  );

  // Add Laptop to quotation
  await quotationsService.addItem(
    quote1.id,
    {
      productId: prodLaptop.id,
      quantity: 1,
      discountPercent: "0.00",
    },
    salesRepUserA,
  );

  const recResponse1 =
    await recommendationEngineService.getRecommendationsForQuotation(
      quote1.id,
      salesRepUserA,
    );

  // Expect: Bag (CROSS_SELL, HIGH), Enterprise Laptop (UPSELL, HIGH), Warranty (CROSS_SELL, MEDIUM)
  // Inactive legacy dock must be excluded!
  if (recResponse1.totalRecommendations !== 3) {
    throw new Error(
      `Scenario 3 Failed: Expected 3 recommendations, got ${recResponse1.totalRecommendations}`,
    );
  }

  const hasBag = recResponse1.recommendations.some(
    (r) =>
      r.recommendedProduct.id === prodBag.id &&
      r.recommendationType === RecommendationTypes.CROSS_SELL,
  );
  const hasUpsell = recResponse1.recommendations.some(
    (r) =>
      r.recommendedProduct.id === prodEnterpriseLaptop.id &&
      r.recommendationType === RecommendationTypes.UPSELL,
  );
  const hasWarranty = recResponse1.recommendations.some(
    (r) => r.recommendedProduct.id === prodWarranty.id,
  );
  const hasInactive = recResponse1.recommendations.some(
    (r) => r.recommendedProduct.id === prodInactive.id,
  );

  if (!hasBag || !hasUpsell || !hasWarranty) {
    throw new Error(
      "Scenario 3 Failed: Missing expected cross-sell or upsell product",
    );
  }
  if (hasInactive) {
    throw new Error(
      "Scenario 3 Failed: Inactive product was returned in recommendations",
    );
  }
  console.log(
    "✓ Scenario 3 Passed: Contextual cross-sell & upsell generated; inactive product filtered.\n",
  );

  // =========================================================================
  // SCENARIO 4 — Price List Integration for Financial Impact
  // =========================================================================
  console.log(
    "[Scenario 4] Testing Price List Resolution in Financial Impact...",
  );

  const warrantyRec = recResponse1.recommendations.find(
    (r) => r.recommendedProduct.id === prodWarranty.id,
  )!;

  // Resolved from Enterprise Price List => 7500.00, not base price 10000.00
  if (
    warrantyRec.financialImpact.unitPrice !== 7500 ||
    warrantyRec.financialImpact.priceSource !== "PRICE_LIST" ||
    warrantyRec.financialImpact.additionalRevenue !== 7500
  ) {
    throw new Error(
      `Scenario 4 Failed: Expected unitPrice 7500 from PRICE_LIST, got ${warrantyRec.financialImpact.unitPrice} (${warrantyRec.financialImpact.priceSource})`,
    );
  }
  console.log(
    "✓ Scenario 4 Passed: Price list resolution correctly computed financial impact.\n",
  );

  // =========================================================================
  // SCENARIO 5 — Duplicate Prevention (Product Already in Quotation)
  // =========================================================================
  console.log("[Scenario 5] Testing Exclusion of Already-Added Products...");

  // Add Laptop Bag to the quotation
  await quotationsService.addItem(
    quote1.id,
    {
      productId: prodBag.id,
      quantity: 1,
      discountPercent: "0.00",
    },
    salesRepUserA,
  );

  const recResponse2 =
    await recommendationEngineService.getRecommendationsForQuotation(
      quote1.id,
      salesRepUserA,
    );

  const bagStillPresent = recResponse2.recommendations.some(
    (r) => r.recommendedProduct.id === prodBag.id,
  );

  if (bagStillPresent) {
    throw new Error(
      "Scenario 5 Failed: Already added product was recommended again",
    );
  }
  console.log(
    "✓ Scenario 5 Passed: Already-added products excluded from recommendations.\n",
  );

  // =========================================================================
  // SCENARIO 6 — Multiple Source Products & Multi-Source De-duplication
  // Quote has: Laptop (recommends Warranty: MEDIUM), Server (recommends Warranty: HIGH)
  // =========================================================================
  console.log(
    "[Scenario 6] Testing Multi-Source De-duplication and Priority Elevation...",
  );

  // Add Server to quote
  await quotationsService.addItem(
    quote1.id,
    {
      productId: prodServer.id,
      quantity: 1,
      discountPercent: "0.00",
    },
    salesRepUserA,
  );

  const recResponse3 =
    await recommendationEngineService.getRecommendationsForQuotation(
      quote1.id,
      salesRepUserA,
    );

  const warrantyRecMulti = recResponse3.recommendations.filter(
    (r) => r.recommendedProduct.id === prodWarranty.id,
  );

  if (warrantyRecMulti.length !== 1) {
    throw new Error(
      `Scenario 6 Failed: Expected 1 de-duplicated warranty recommendation, got ${warrantyRecMulti.length}`,
    );
  }

  // Priority should be elevated to HIGH (since Server -> Warranty is HIGH)
  if (warrantyRecMulti[0].priority !== RecommendationPriorities.HIGH) {
    throw new Error(
      `Scenario 6 Failed: Expected priority HIGH for multi-triggered warranty, got ${warrantyRecMulti[0].priority}`,
    );
  }

  // Should have 2 triggers
  if (warrantyRecMulti[0].triggeredBy.length !== 2) {
    throw new Error(
      `Scenario 6 Failed: Expected 2 triggers, got ${warrantyRecMulti[0].triggeredBy.length}`,
    );
  }
  console.log(
    "✓ Scenario 6 Passed: Multi-source triggers consolidated and priority elevated to HIGH.\n",
  );

  // =========================================================================
  // SCENARIO 7 — Accept Recommendation (Adds Item, Snapshots & Event)
  // =========================================================================
  console.log("[Scenario 7] Testing Accept Recommendation Flow...");

  const quote2 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: enterprisePriceList.id,
      currency: "INR",
      issueDate: "2026-09-05",
      expiryDate: "2026-10-05",
    },
    salesRepUserA,
  );

  await quotationsService.addItem(
    quote2.id,
    {
      productId: prodPrinter.id,
      quantity: 1,
      discountPercent: "0.00",
    },
    salesRepUserA,
  );

  // Accept Toner recommendation
  const acceptResult =
    await recommendationAcceptanceService.acceptRecommendation(
      quote2.id,
      rulePrinterToner.id,
      { quantity: 2 },
      salesRepUserA,
    );

  if (
    !acceptResult.item ||
    acceptResult.item.productId !== prodToner.id ||
    acceptResult.item.quantity !== 2
  ) {
    throw new Error(
      "Scenario 7 Failed: Recommended item was not added properly",
    );
  }

  // Verify tracking event
  const events = await db
    .select()
    .from(recommendationEvents)
    .where(eq(recommendationEvents.quotationId, quote2.id));

  const acceptEvent = events.find(
    (e) =>
      e.eventType === RecommendationEventTypes.ACCEPTED &&
      e.recommendedProductId === prodToner.id,
  );

  if (!acceptEvent) {
    throw new Error(
      "Scenario 7 Failed: Recommendation ACCEPTED event was not recorded",
    );
  }
  console.log(
    "✓ Scenario 7 Passed: Recommendation accepted, quotation updated, and event logged.\n",
  );

  // =========================================================================
  // SCENARIO 8 — Duplicate Acceptance Protection
  // =========================================================================
  console.log("[Scenario 8] Testing Duplicate Acceptance Protection...");

  let duplicateBlocked = false;
  try {
    await recommendationAcceptanceService.acceptRecommendation(
      quote2.id,
      rulePrinterToner.id,
      { quantity: 1 },
      salesRepUserA,
    );
  } catch (err: any) {
    duplicateBlocked = true;
  }

  if (!duplicateBlocked) {
    throw new Error(
      "Scenario 8 Failed: System permitted duplicate acceptance of already added product",
    );
  }
  console.log(
    "✓ Scenario 8 Passed: Duplicate recommendation acceptance rejected with ConflictError.\n",
  );

  // =========================================================================
  // SCENARIO 9 — Recommendation Dismissal
  // =========================================================================
  console.log("[Scenario 9] Testing Recommendation Dismissal...");

  const quote3 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: enterprisePriceList.id,
      currency: "INR",
      issueDate: "2026-09-05",
      expiryDate: "2026-10-05",
    },
    salesRepUserA,
  );

  await quotationsService.addItem(
    quote3.id,
    {
      productId: prodLaptop.id,
      quantity: 1,
      discountPercent: "0.00",
    },
    salesRepUserA,
  );

  // Dismiss Laptop Bag recommendation for quote3
  await recommendationAcceptanceService.dismissRecommendation(
    quote3.id,
    prodBag.id,
    salesRepUserA,
  );

  const recResponseAfterDismiss =
    await recommendationEngineService.getRecommendationsForQuotation(
      quote3.id,
      salesRepUserA,
    );

  const bagPresentAfterDismiss = recResponseAfterDismiss.recommendations.some(
    (r) => r.recommendedProduct.id === prodBag.id,
  );

  if (bagPresentAfterDismiss) {
    throw new Error(
      "Scenario 9 Failed: Dismissed recommendation was still returned",
    );
  }
  console.log(
    "✓ Scenario 9 Passed: Dismissed recommendation excluded from future suggestions.\n",
  );

  // =========================================================================
  // SCENARIO 10 — Commercial Modification & Approval Invalidation via Recommendation
  // =========================================================================
  console.log(
    "[Scenario 10] Testing Phase 6 Approval Invalidation on Recommendation Acceptance...",
  );

  const quote4 = await quotationsService.createQuotation(
    {
      customerId: customerA.id,
      priceListId: enterprisePriceList.id,
      currency: "INR",
      issueDate: "2026-09-05",
      expiryDate: "2026-10-05",
    },
    salesRepUserA,
  );

  // Add Laptop with high discount (25%) => requires manager approval
  await quotationsService.addItem(
    quote4.id,
    {
      productId: prodLaptop.id,
      quantity: 1,
      discountPercent: "25.00",
    },
    salesRepUserA,
  );

  const submitResult = await approvalRoutingService.submitQuotation(
    quote4.id,
    salesRepUserA.userId,
    Roles.SALES_REP,
  );

  if (submitResult.status !== QuotationStatuses.PENDING_MANAGER_APPROVAL) {
    throw new Error(
      "Scenario 10 Setup Failed: Quotation not routed to PENDING_MANAGER_APPROVAL",
    );
  }

  // Accept Warranty recommendation while quote is pending approval
  await recommendationAcceptanceService.acceptRecommendation(
    quote4.id,
    prodWarranty.id,
    { quantity: 1 },
    salesRepUserA,
  );

  const quote4PostRec = await quotationsService.getQuotationById(
    quote4.id,
    salesRepUserA,
  );
  if (quote4PostRec.status !== QuotationStatuses.DRAFT) {
    throw new Error(
      `Scenario 10 Failed: Quotation status did not revert to DRAFT, got ${quote4PostRec.status}`,
    );
  }

  const existingApprovals = await db
    .select()
    .from(quotationApprovals)
    .where(eq(quotationApprovals.quotationId, quote4.id));

  const allInvalidated = existingApprovals.every(
    (a) => a.status === ApprovalStatuses.INVALIDATED,
  );

  if (!allInvalidated) {
    throw new Error(
      "Scenario 10 Failed: Prior approval records were not invalidated",
    );
  }
  console.log(
    "✓ Scenario 10 Passed: Accepting recommendation invalidated approval workflow and reset status to DRAFT.\n",
  );

  // =========================================================================
  // SCENARIO 11 — RBAC Access & Ownership Isolation
  // =========================================================================
  console.log(
    "[Scenario 11] Testing RBAC & Ownership Security Restrictions...",
  );

  // Sales Rep B should NOT be able to view recommendations for Sales Rep A's draft quote
  let accessBlocked = false;
  try {
    await recommendationEngineService.getRecommendationsForQuotation(
      quote4.id,
      salesRepUserB,
    );
  } catch (err: any) {
    accessBlocked = true;
  }

  if (!accessBlocked) {
    throw new Error(
      "Scenario 11 Failed: Sales Rep B accessed draft quotation recommendations of Sales Rep A",
    );
  }

  // Sales Manager CAN view recommendations for any quotation
  const managerRecs =
    await recommendationEngineService.getRecommendationsForQuotation(
      quote4.id,
      salesManagerUser,
    );

  if (!managerRecs) {
    throw new Error(
      "Scenario 11 Failed: Sales Manager was blocked from viewing quotation recommendations",
    );
  }
  console.log(
    "✓ Scenario 11 Passed: Ownership isolation and role permissions enforced.\n",
  );

  console.log("========================================");
  console.log("ALL PHASE 7 TESTS PASSED SUCCESSFULLY! ✓");
  console.log("========================================\n");
  process.exit(0);
}

runPhase7Tests().catch((err) => {
  console.error("Phase 7 Verification Suite Failed:", err);
  process.exit(1);
});
