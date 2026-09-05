import {
  recommendationsRepository,
  RecommendationsRepository,
} from '../repositories/recommendations.repository.js';
import { quotationsService } from '../../quotations/services/quotations.service.js';
import { productsRepository } from '../../products/repositories/products.repository.js';
import { AuthUserContext } from '../../rbac/types/index.js';
import {
  NotFoundError,
  ConflictError,
} from '../../../common/errors/index.js';
import { AcceptRecommendationInput } from '../types/index.js';
import { RecommendationEventTypes } from '../constants/recommendationEvents.js';

export class RecommendationAcceptanceService {
  constructor(
    private readonly repository: RecommendationsRepository = recommendationsRepository
  ) {}

  async acceptRecommendation(
    quotationId: string,
    recommendationId: string,
    input: AcceptRecommendationInput,
    user: AuthUserContext
  ) {
    // 1. Resolve recommended product and rule ID
    let recommendedProductId = recommendationId;
    let ruleId: string | null = null;
    let defaultQty = 1;

    const rule = await this.repository.findRuleById(recommendationId);
    if (rule) {
      recommendedProductId = rule.recommendedProductId;
      ruleId = rule.id;
      defaultQty = rule.defaultQuantity || 1;
    } else {
      // Check if recommendationId is direct product ID
      const product = await productsRepository.findById(recommendationId);
      if (!product) {
        throw new NotFoundError(
          `Recommendation or Product with ID '${recommendationId}' was not found`
        );
      }
      recommendedProductId = product.id;
    }

    // 2. Fetch quotation and check if product is already added
    const quotation = await quotationsService.getQuotationById(quotationId, user);
    const existingItem = (quotation.items || []).find(
      (item) => item.productId === recommendedProductId
    );

    if (existingItem) {
      throw new ConflictError(
        `Product '${existingItem.productNameSnapshot}' is already in this quotation`
      );
    }

    const quantity = input.quantity && input.quantity > 0 ? input.quantity : defaultQty;
    const discountPercent = input.discountPercent || '0.00';

    // 3. Add item to quotation via existing QuotationsService domain logic
    // This automatically handles:
    // - Quotation editability assertion
    // - Phase 6 approval invalidation & revert to DRAFT
    // - Product pricing resolution from price list
    // - Item snapshot recording
    // - Quotation total recalculation
    const { item, quotation: updatedQuotation } = await quotationsService.addItem(
      quotationId,
      {
        productId: recommendedProductId,
        quantity,
        discountPercent,
      },
      user
    );

    // 4. Record ACCEPTED event for analytics & lifecycle tracking
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const grossAmount = parseFloat(item.grossAmount) || 0;

    await this.repository.recordEvent({
      quotationId,
      recommendationRuleId: ruleId,
      recommendedProductId,
      eventType: RecommendationEventTypes.ACCEPTED,
      quantity,
      unitPrice: unitPrice.toFixed(2),
      additionalRevenue: grossAmount.toFixed(2),
      createdById: user.userId,
    });

    return {
      success: true,
      message: `Recommendation accepted: added '${item.productNameSnapshot}' to quotation`,
      item,
      quotation: updatedQuotation,
    };
  }

  async dismissRecommendation(
    quotationId: string,
    recommendationId: string,
    user: AuthUserContext
  ) {
    // 1. Verify quotation exists and user has access
    await quotationsService.getQuotationById(quotationId, user);

    // 2. Resolve recommended product ID
    let recommendedProductId = recommendationId;
    let ruleId: string | null = null;

    const rule = await this.repository.findRuleById(recommendationId);
    if (rule) {
      recommendedProductId = rule.recommendedProductId;
      ruleId = rule.id;
    } else {
      const product = await productsRepository.findById(recommendationId);
      if (!product) {
        throw new NotFoundError(
          `Recommendation or Product with ID '${recommendationId}' was not found`
        );
      }
      recommendedProductId = product.id;
    }

    // 3. Record DISMISSED event
    await this.repository.recordEvent({
      quotationId,
      recommendationRuleId: ruleId,
      recommendedProductId,
      eventType: RecommendationEventTypes.DISMISSED,
      createdById: user.userId,
    });

    return {
      success: true,
      message: 'Recommendation dismissed successfully for this quotation',
    };
  }
}

export const recommendationAcceptanceService = new RecommendationAcceptanceService();
