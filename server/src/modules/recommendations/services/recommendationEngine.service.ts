import {
  recommendationsRepository,
  RecommendationsRepository,
} from '../repositories/recommendations.repository.js';
import { quotationsRepository } from '../../quotations/repositories/quotations.repository.js';
import { pricingService } from '../../pricing/services/pricing.service.js';
import { AuthUserContext } from '../../rbac/types/index.js';
import { Roles } from '../../rbac/constants/roles.js';
import {
  NotFoundError,
  ForbiddenError,
} from '../../../common/errors/index.js';
import {
  QuotationRecommendationsResponse,
  QuotationRecommendationItem,
  RecommendationTrigger,
} from '../types/index.js';
import {
  PriorityWeights,
  RecommendationPriority,
  RecommendationPriorities,
} from '../constants/recommendationPriorities.js';
import { RecommendationType } from '../constants/recommendationTypes.js';

export class RecommendationEngineService {
  constructor(
    private readonly repository: RecommendationsRepository = recommendationsRepository
  ) {}

  async getRecommendationsForQuotation(
    quotationId: string,
    user: AuthUserContext
  ): Promise<QuotationRecommendationsResponse> {
    // 1. Fetch quotation with items
    const quotation = await quotationsRepository.findById(quotationId);
    if (!quotation) {
      throw new NotFoundError(`Quotation with ID '${quotationId}' was not found`);
    }

    // 2. Ownership / Access Control
    const isSalesAdminOrManager =
      user.roles.includes(Roles.ADMIN) || user.roles.includes(Roles.SALES_MANAGER);

    if (!isSalesAdminOrManager && quotation.createdBy !== user.userId) {
      throw new ForbiddenError(
        'You are not authorized to view recommendations for this quotation'
      );
    }

    const items = quotation.items || [];
    if (items.length === 0) {
      return {
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        priceListId: quotation.priceListId,
        currency: quotation.currency,
        totalRecommendations: 0,
        recommendations: [],
      };
    }

    // 3. Extract existing products in the quotation
    const currentProductIds = new Set<string>(items.map((i) => i.productId));

    // 4. Retrieve dismissed product IDs for this quotation
    const dismissedProductIds = new Set<string>(
      await this.repository.getDismissedProductIdsForQuotation(quotationId)
    );

    // 5. Query all active recommendation rules matching quotation products
    const activeRulesWithProducts =
      await this.repository.findActiveRulesBySourceProductIds(
        Array.from(currentProductIds)
      );

    // 6. Group and de-duplicate recommendations by recommendedProductId
    interface GroupedRec {
      ruleId: string;
      recommendedProduct: typeof activeRulesWithProducts[0]['recommendedProduct'];
      recommendationType: RecommendationType;
      priority: RecommendationPriority;
      priorityWeight: number;
      defaultQuantity: number;
      description: string | null;
      triggers: RecommendationTrigger[];
    }

    const groupedMap = new Map<string, GroupedRec>();

    for (const match of activeRulesWithProducts) {
      const recProdId = match.recommendedProduct.id;

      // Filter out if product is already in quotation
      if (currentProductIds.has(recProdId)) {
        continue;
      }

      // Filter out if recommendation was dismissed for this quotation
      if (dismissedProductIds.has(recProdId)) {
        continue;
      }

      // Filter out self-recommendation or inactive product
      if (
        match.rule.sourceProductId === recProdId ||
        !match.recommendedProduct.isActive
      ) {
        continue;
      }

      const rulePriority = (match.rule.priority ||
        RecommendationPriorities.MEDIUM) as RecommendationPriority;
      const ruleWeight = PriorityWeights[rulePriority] || 2;
      const ruleType = match.rule.recommendationType as RecommendationType;

      const trigger: RecommendationTrigger = {
        productId: match.sourceProduct.id,
        productName: match.sourceProduct.name,
        sku: match.sourceProduct.sku,
        recommendationType: ruleType,
        ruleId: match.rule.id,
      };

      if (!groupedMap.has(recProdId)) {
        groupedMap.set(recProdId, {
          ruleId: match.rule.id,
          recommendedProduct: match.recommendedProduct,
          recommendationType: ruleType,
          priority: rulePriority,
          priorityWeight: ruleWeight,
          defaultQuantity: match.rule.defaultQuantity || 1,
          description: match.rule.description,
          triggers: [trigger],
        });
      } else {
        const existing = groupedMap.get(recProdId)!;
        existing.triggers.push(trigger);

        // Elevate priority if this new rule has higher priority
        if (ruleWeight > existing.priorityWeight) {
          existing.priority = rulePriority;
          existing.priorityWeight = ruleWeight;
          existing.ruleId = match.rule.id;
          existing.recommendationType = ruleType;
        }

        if (match.rule.defaultQuantity > existing.defaultQuantity) {
          existing.defaultQuantity = match.rule.defaultQuantity;
        }
      }
    }

    // 7. Resolve pricing and calculate financial impact for each recommended product
    const recommendationItems: QuotationRecommendationItem[] = [];

    for (const group of groupedMap.values()) {
      const prod = group.recommendedProduct;

      // Pricing resolution via Phase 4 Pricing Engine
      const priceResolution = await pricingService.resolveProductPrice({
        productId: prod.id,
        priceListId: quotation.priceListId,
        currency: quotation.currency,
      });

      const unitPrice = parseFloat(priceResolution.effectivePrice) || 0;
      const quantity = group.defaultQuantity;
      const additionalRevenue = Math.round(unitPrice * quantity * 100) / 100;

      recommendationItems.push({
        id: prod.id,
        ruleId: group.ruleId,
        recommendedProduct: {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          description: prod.description,
          productType: prod.productType,
          categoryId: prod.categoryId,
          categoryName: prod.categoryName || undefined,
          basePrice: prod.basePrice,
          currency: prod.currency,
        },
        recommendationType: group.recommendationType,
        priority: group.priority,
        priorityWeight: group.priorityWeight,
        recommendedQuantity: quantity,
        description: group.description,
        financialImpact: {
          unitPrice,
          currency: quotation.currency,
          recommendedQuantity: quantity,
          additionalRevenue,
          priceSource: priceResolution.priceSource,
          priceListId: priceResolution.priceListId,
          estimatedMarginImpact: null, // Product cost data is not in base product schema
        },
        triggeredBy: group.triggers,
      });
    }

    // 8. Sort recommendations: Priority (HIGH > MEDIUM > LOW), then product name
    recommendationItems.sort((a, b) => {
      if (b.priorityWeight !== a.priorityWeight) {
        return b.priorityWeight - a.priorityWeight;
      }
      return a.recommendedProduct.name.localeCompare(b.recommendedProduct.name);
    });

    return {
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      priceListId: quotation.priceListId,
      currency: quotation.currency,
      totalRecommendations: recommendationItems.length,
      recommendations: recommendationItems,
    };
  }
}

export const recommendationEngineService = new RecommendationEngineService();
