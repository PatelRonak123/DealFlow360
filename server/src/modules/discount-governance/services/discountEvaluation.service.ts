import { db, Database, DbClient } from '../../../database/db.js';
import {
  quotations,
  quotationItems,
  customers,
  customerTiers,
  customerTierDiscountRules,
  products,
  productCategories,
  categoryDiscountRules,
} from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '../../../common/errors/AppError.js';
import {
  RiskCalculationService,
  QuotationRiskResult,
} from './riskCalculation.service.js';
import {
  GovernanceThresholds,
  ApprovalRoutes,
  ApprovalRoute,
} from '../constants/thresholds.js';
import { ApprovalLevels, ApprovalLevel } from '../constants/approvalLevels.js';

export interface LineDiscountEvaluationDetail {
  quotationItemId: string;
  productId: string;
  productName: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  appliedDiscount: number;
  customerTierLimit: number;
  categoryLimit: number;
  effectiveAllowedDiscount: number;
  excessDiscount: number;
  isViolation: boolean;
  riskContribution: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
}

export interface QuotationDiscountEvaluationResult {
  quotationId: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerTierId: string | null;
  customerTierName: string | null;
  subtotalAmount: number;
  totalDiscountAmount: number;
  totalAmount: number;
  totalViolations: number;
  riskScore: number;
  weightedExcessRisk: number;
  approvalRequired: boolean;
  approvalRoute: ApprovalRoute;
  requiredApprovalLevels: ApprovalLevel[];
  lineEvaluations: LineDiscountEvaluationDetail[];
}

export class DiscountEvaluationService {
  private db: Database;
  private riskCalculationService: RiskCalculationService;

  constructor(
    databaseClient: Database = db,
    riskCalcService: RiskCalculationService = new RiskCalculationService()
  ) {
    this.db = databaseClient;
    this.riskCalculationService = riskCalcService;
  }

  /**
   * Evaluates all line items of a quotation against customer tier and category discount rules,
   * calculating the effective allowed discount, violations, blended risk score, and required approval route.
   */
  public async evaluateQuotation(
    quotationId: string,
    trx?: DbClient
  ): Promise<QuotationDiscountEvaluationResult> {
    const client = trx || this.db;

    // 1. Fetch quotation
    const [quotation] = await client
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId));

    if (!quotation) {
      throw new NotFoundError(`Quotation with ID '${quotationId}' was not found`);
    }

    // 2. Fetch customer and tier rule
    const [customer] = await client
      .select()
      .from(customers)
      .where(eq(customers.id, quotation.customerId));

    let tierLimit: number = GovernanceThresholds.DEFAULT_FALLBACK_DISCOUNT_LIMIT;
    let customerTierName: string | null = null;

    if (customer?.customerTierId) {
      const [tier] = await client
        .select()
        .from(customerTiers)
        .where(eq(customerTiers.id, customer.customerTierId));

      if (tier) {
        customerTierName = tier.name;
        const [tierRule] = await client
          .select()
          .from(customerTierDiscountRules)
          .where(eq(customerTierDiscountRules.customerTierId, tier.id));

        if (tierRule && tierRule.isActive) {
          tierLimit = Number(tierRule.maxDiscountPercent);
        }
      }
    }

    // 3. Fetch quotation items
    const items = await client
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId))
      .orderBy(quotationItems.createdAt);

    // 4. Fetch products and category rules for each item
    const lineInputs = [];
    const lineItemDetails = [];

    for (const item of items) {
      let categoryLimit: number = GovernanceThresholds.DEFAULT_FALLBACK_DISCOUNT_LIMIT;
      let categoryId = '';
      let categoryName = 'Uncategorized';

      const [product] = await client
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (product?.categoryId) {
        categoryId = product.categoryId;
        const [category] = await client
          .select()
          .from(productCategories)
          .where(eq(productCategories.id, product.categoryId));

        if (category) {
          categoryName = category.name;
        }

        const [catRule] = await client
          .select()
          .from(categoryDiscountRules)
          .where(eq(categoryDiscountRules.categoryId, product.categoryId));

        if (catRule && catRule.isActive) {
          categoryLimit = Number(catRule.maxDiscountPercent);
        }
      }

      const effectiveAllowedDiscount = Math.min(tierLimit, categoryLimit);
      const appliedDiscount = Number(item.discountPercent);
      const lineGrossAmount = Number(item.grossAmount);

      lineInputs.push({
        appliedDiscount,
        effectiveAllowedDiscount,
        lineGrossAmount,
      });

      lineItemDetails.push({
        quotationItemId: item.id,
        productId: item.productId,
        productName: item.productNameSnapshot || product?.name || 'Unknown Product',
        sku: item.skuSnapshot || product?.sku || '',
        categoryId,
        categoryName,
        appliedDiscount,
        customerTierLimit: tierLimit,
        categoryLimit,
        effectiveAllowedDiscount,
        grossAmount: lineGrossAmount,
        discountAmount: Number(item.discountAmount),
        netAmount: Number(item.netAmount),
      });
    }

    const totalGrossAmount = Number(quotation.subtotal);

    // 5. Calculate blended risk score
    const riskResult: QuotationRiskResult = this.riskCalculationService.calculateRisk(
      lineInputs,
      totalGrossAmount
    );

    // 6. Merge line calculation results
    const lineEvaluations: LineDiscountEvaluationDetail[] = lineItemDetails.map(
      (detail, index) => {
        const lineRisk = riskResult.lineRisks[index];
        return {
          ...detail,
          excessDiscount: lineRisk.excessDiscount,
          isViolation: lineRisk.isViolation,
          riskContribution: lineRisk.riskContribution,
        };
      }
    );

    // 7. Determine approval route and levels
    let approvalRoute: ApprovalRoute = ApprovalRoutes.NO_APPROVAL;
    const requiredApprovalLevels: ApprovalLevel[] = [];

    if (riskResult.riskScore === 0) {
      approvalRoute = ApprovalRoutes.NO_APPROVAL;
    } else if (
      riskResult.riskScore > 0 &&
      riskResult.riskScore <= GovernanceThresholds.MANAGER_APPROVAL_THRESHOLD
    ) {
      approvalRoute = ApprovalRoutes.MANAGER;
      requiredApprovalLevels.push(ApprovalLevels.MANAGER);
    } else {
      approvalRoute = ApprovalRoutes.MANAGER_AND_FINANCE;
      requiredApprovalLevels.push(ApprovalLevels.MANAGER, ApprovalLevels.FINANCE);
    }

    const approvalRequired = requiredApprovalLevels.length > 0;

    return {
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      customerName: customer?.companyName || 'Unknown Customer',
      customerTierId: customer?.customerTierId || null,
      customerTierName,
      subtotalAmount: Number(quotation.subtotal),
      totalDiscountAmount: Number(quotation.discountAmount),
      totalAmount: Number(quotation.totalAmount),
      totalViolations: riskResult.totalViolations,
      riskScore: riskResult.riskScore,
      weightedExcessRisk: riskResult.weightedExcessRisk,
      approvalRequired,
      approvalRoute,
      requiredApprovalLevels,
      lineEvaluations,
    };
  }
}
