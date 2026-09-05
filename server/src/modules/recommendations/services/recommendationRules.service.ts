import {
  recommendationsRepository,
  RecommendationsRepository,
} from '../repositories/recommendations.repository.js';
import { productsRepository } from '../../products/repositories/products.repository.js';
import {
  CreateRecommendationRuleInput,
  UpdateRecommendationRuleInput,
  ListRecommendationRulesQuery,
} from '../types/index.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../../common/errors/index.js';

export class RecommendationRulesService {
  constructor(
    private readonly repository: RecommendationsRepository = recommendationsRepository
  ) {}

  async createRule(input: CreateRecommendationRuleInput) {
    if (input.sourceProductId === input.recommendedProductId) {
      throw new BadRequestError('Source product and recommended product cannot be the same');
    }

    // 1. Verify source product exists
    const sourceProduct = await productsRepository.findById(input.sourceProductId);
    if (!sourceProduct) {
      throw new NotFoundError(
        `Source product with ID '${input.sourceProductId}' was not found`
      );
    }

    // 2. Verify recommended product exists
    const recommendedProduct = await productsRepository.findById(
      input.recommendedProductId
    );
    if (!recommendedProduct) {
      throw new NotFoundError(
        `Recommended product with ID '${input.recommendedProductId}' was not found`
      );
    }

    // 3. Check for existing duplicate rule
    const existing = await this.repository.findDuplicateRule(
      input.sourceProductId,
      input.recommendedProductId
    );
    if (existing) {
      throw new ConflictError(
        `A recommendation rule already exists between source product '${sourceProduct.name}' and recommended product '${recommendedProduct.name}'`
      );
    }

    return await this.repository.createRule({
      sourceProductId: input.sourceProductId,
      recommendedProductId: input.recommendedProductId,
      recommendationType: input.recommendationType,
      priority: input.priority || 'MEDIUM',
      defaultQuantity: input.defaultQuantity || 1,
      description: input.description || null,
      isActive: input.isActive !== undefined ? input.isActive : true,
    });
  }

  async getRuleById(id: string) {
    const rule = await this.repository.findRuleById(id);
    if (!rule) {
      throw new NotFoundError(`Recommendation rule with ID '${id}' was not found`);
    }
    return rule;
  }

  async updateRule(id: string, input: UpdateRecommendationRuleInput) {
    const existing = await this.getRuleById(id);

    const updated = await this.repository.updateRule(id, {
      recommendationType: input.recommendationType ?? existing.recommendationType,
      priority: input.priority ?? existing.priority,
      defaultQuantity: input.defaultQuantity ?? existing.defaultQuantity,
      description: input.description !== undefined ? input.description : existing.description,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
    });

    if (!updated) {
      throw new NotFoundError(`Recommendation rule with ID '${id}' was not found`);
    }

    return updated;
  }

  async deleteRule(id: string) {
    await this.getRuleById(id);
    return await this.repository.deleteRule(id);
  }

  async listRules(query: ListRecommendationRulesQuery) {
    return await this.repository.listRules(query);
  }
}

export const recommendationRulesService = new RecommendationRulesService();
