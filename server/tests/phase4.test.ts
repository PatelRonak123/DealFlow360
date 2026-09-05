import { pricingService } from '../src/modules/pricing/services/pricing.service.js';
import { discountRulesService } from '../src/modules/discount-rules/services/discountRules.service.js';
import { priceListsService } from '../src/modules/price-lists/services/priceLists.service.js';
import { customerTiersService } from '../src/modules/customer-tiers/services/customerTiers.service.js';
import { categoriesService } from '../src/modules/categories/services/categories.service.js';
import { productsService } from '../src/modules/products/services/products.service.js';
import { pool } from '../src/database/db.js';

async function runPhase4Tests() {
  console.log('=== Starting Phase 4 Automated Verification Suite ===\n');

  try {
    // 1. Create Test Master Data
    console.log('[Test 1] Setting up master data for tests...');
    const testTier = await customerTiersService.createCustomerTier({
      name: `Test Tier ${Date.now()}`,
      description: 'Test Tier for discount rules',
      isActive: true,
    });

    const testCategory = await categoriesService.createCategory({
      name: `Test Category ${Date.now()}`,
      description: 'Test Category for discount rules',
      isActive: true,
    });

    const testProduct = await productsService.createProduct({
      name: `Test Product ${Date.now()}`,
      sku: `SKU-TEST-${Date.now()}`,
      categoryId: testCategory.id,
      productType: 'ONE_TIME',
      basePrice: '5000.00',
      currency: 'INR',
      isActive: true,
    });
    console.log('✓ Master data created successfully.\n');

    // 2. Price List Tests
    console.log('[Test 2] Testing Price Lists & Items...');
    const standardList = await priceListsService.createPriceList({
      name: `Standard Pricing ${Date.now()}`,
      currency: 'INR',
      isDefault: true,
      isActive: true,
    });
    console.log(`✓ Created default price list: ${standardList.name}`);

    // Add item to standard list
    const standardItem = await priceListsService.addProductPrice(standardList.id, {
      productId: testProduct.id,
      price: '4500.00',
    });
    console.log(`✓ Added product to price list at custom price: ₹${standardItem.price}`);

    // Create a special promo list (non-default) without this product
    const promoList = await priceListsService.createPriceList({
      name: `Promo List ${Date.now()}`,
      currency: 'INR',
      isDefault: false,
      isActive: true,
    });
    console.log(`✓ Created non-default promo price list: ${promoList.name}`);

    // 3. Pricing Resolution Tests
    console.log('\n[Test 3] Testing Pricing Resolution Engine...');
    // A. Resolve with standard list -> should use PRICE_LIST (₹4500)
    const resStandard = await pricingService.resolveProductPrice({
      productId: testProduct.id,
      priceListId: standardList.id,
    });
    if (resStandard.priceSource !== 'PRICE_LIST' || resStandard.effectivePrice !== '4500.00') {
      throw new Error(`Expected PRICE_LIST ₹4500.00, got ${resStandard.priceSource} ₹${resStandard.effectivePrice}`);
    }
    console.log(`✓ Explicit Price List Resolution: ${resStandard.priceSource} => ₹${resStandard.effectivePrice}`);

    // B. Resolve with promo list (product not added) -> should fallback to BASE_PRICE (₹5000)
    const resPromoFallback = await pricingService.resolveProductPrice({
      productId: testProduct.id,
      priceListId: promoList.id,
    });
    if (resPromoFallback.priceSource !== 'BASE_PRICE' || resPromoFallback.effectivePrice !== '5000.00') {
      throw new Error(`Expected BASE_PRICE ₹5000.00, got ${resPromoFallback.priceSource} ₹${resPromoFallback.effectivePrice}`);
    }
    console.log(`✓ Price List Missing Item Fallback: ${resPromoFallback.priceSource} => ₹${resPromoFallback.effectivePrice}`);

    // C. Resolve without priceListId -> should automatically pick active default price list (₹4500)
    const resDefault = await pricingService.resolveProductPrice({
      productId: testProduct.id,
      currency: 'INR',
    });
    if (resDefault.priceSource !== 'PRICE_LIST' || resDefault.effectivePrice !== '4500.00') {
      throw new Error(`Expected Default PRICE_LIST ₹4500.00, got ${resDefault.priceSource} ₹${resDefault.effectivePrice}`);
    }
    console.log(`✓ Auto Default Price List Resolution: ${resDefault.priceSource} => ₹${resDefault.effectivePrice}`);

    // 4. Discount Rules Tests
    console.log('\n[Test 4] Testing Customer Tier & Category Discount Rules...');
    // Create Tier Rule: 15%
    const tierRule = await discountRulesService.createTierRule({
      customerTierId: testTier.id,
      maxDiscountPercent: '15.00',
      isActive: true,
    });
    console.log(`✓ Configured Tier Discount Rule: ${tierRule.maxDiscountPercent}%`);

    // Create Category Rule: 10%
    const categoryRule = await discountRulesService.createCategoryRule({
      categoryId: testCategory.id,
      maxDiscountPercent: '10.00',
      isActive: true,
    });
    console.log(`✓ Configured Category Discount Rule: ${categoryRule.maxDiscountPercent}%`);

    // 5. Effective Discount Resolution (Conservative MIN Rule)
    console.log('\n[Test 5] Testing Effective Discount Resolution Logic...');
    // A. Tier=15%, Category=10% -> Effective = MIN(15, 10) = 10%
    const effRes1 = await discountRulesService.getEffectiveDiscountLimit({
      customerTierId: testTier.id,
      categoryId: testCategory.id,
    });
    if (effRes1.effectiveLimit !== 10) {
      throw new Error(`Expected effective limit 10%, got ${effRes1.effectiveLimit}%`);
    }
    console.log(`✓ Tier 15% + Category 10% => Effective Limit: ${effRes1.effectiveLimit}% (MIN formula)`);

    // Update Tier Rule to 8% -> Effective = MIN(8, 10) = 8%
    await discountRulesService.updateTierRule(tierRule.id, {
      maxDiscountPercent: '8.00',
    });
    const effRes2 = await discountRulesService.getEffectiveDiscountLimit({
      customerTierId: testTier.id,
      categoryId: testCategory.id,
    });
    if (effRes2.effectiveLimit !== 8) {
      throw new Error(`Expected effective limit 8%, got ${effRes2.effectiveLimit}%`);
    }
    console.log(`✓ Tier 8% + Category 10% => Effective Limit: ${effRes2.effectiveLimit}% (MIN formula)`);

    // Clean up test records
    console.log('\n[Cleanup] Cleaning up test records...');
    await discountRulesService.deleteTierRule(tierRule.id);
    await discountRulesService.deleteCategoryRule(categoryRule.id);
    await priceListsService.deletePriceList(standardList.id);
    await priceListsService.deletePriceList(promoList.id);
    await productsService.deleteProduct(testProduct.id);
    await categoriesService.deleteCategory(testCategory.id);
    await customerTiersService.deleteCustomerTier(testTier.id);
    console.log('✓ Cleanup completed.');

    console.log('\n========================================');
    console.log('ALL PHASE 4 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ Phase 4 Test Suite Failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPhase4Tests();
