import { RecommendationType } from '../constants/recommendationTypes.js';
import { RecommendationPriority } from '../constants/recommendationPriorities.js';

export interface CreateRecommendationRuleInput {
  sourceProductId: string;
  recommendedProductId: string;
  recommendationType: RecommendationType;
  priority?: RecommendationPriority;
  defaultQuantity?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateRecommendationRuleInput {
  recommendationType?: RecommendationType;
  priority?: RecommendationPriority;
  defaultQuantity?: number;
  description?: string | null;
  isActive?: boolean;
}

export interface ListRecommendationRulesQuery {
  page?: number;
  limit?: number;
  sourceProductId?: string;
  recommendedProductId?: string;
  recommendationType?: RecommendationType;
  priority?: RecommendationPriority;
  isActive?: boolean;
}

export interface RecommendationTrigger {
  productId: string;
  productName: string;
  sku: string;
  recommendationType: RecommendationType;
  ruleId: string;
}

export interface FinancialImpactDto {
  unitPrice: number;
  currency: string;
  recommendedQuantity: number;
  additionalRevenue: number;
  priceSource: 'PRICE_LIST' | 'BASE_PRICE';
  priceListId: string | null;
  estimatedMarginImpact: number | null; // null if product cost is not tracked
}

export interface RecommendedProductDto {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  productType: string;
  categoryId: string;
  categoryName?: string;
  basePrice: string;
  currency: string;
}

export interface QuotationRecommendationItem {
  id: string; // Recommended Product ID or Primary Rule ID
  ruleId: string;
  recommendedProduct: RecommendedProductDto;
  recommendationType: RecommendationType;
  priority: RecommendationPriority;
  priorityWeight: number;
  recommendedQuantity: number;
  description: string | null;
  financialImpact: FinancialImpactDto;
  triggeredBy: RecommendationTrigger[];
}

export interface QuotationRecommendationsResponse {
  quotationId: string;
  quotationNumber: string;
  priceListId: string;
  currency: string;
  totalRecommendations: number;
  recommendations: QuotationRecommendationItem[];
}

export interface AcceptRecommendationInput {
  quantity?: number;
  discountPercent?: string;
}
