import {
  discountRulesRepository,
  DiscountRulesRepository,
  PaginatedTierRules,
  PaginatedCategoryRules,
  CustomerTierRuleWithTier,
  CategoryRuleWithCategory,
} from '../repositories/discountRules.repository.js';
import {
  CreateCustomerTierDiscountRuleInput,
  UpdateCustomerTierDiscountRuleInput,
  CreateCategoryDiscountRuleInput,
  UpdateCategoryDiscountRuleInput,
  DiscountRuleQueryInput,
} from '../validators/discountRule.validator.js';
import { customerTiersRepository } from '../../customer-tiers/repositories/customerTiers.repository.js';
import { categoriesRepository } from '../../categories/repositories/categories.repository.js';
import {
  CustomerTierDiscountRule,
  CategoryDiscountRule,
} from '../../../database/schema/index.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../common/errors/index.js';

export interface EffectiveDiscountResolution {
  customerTierId?: string;
  customerTierName?: string;
  tierLimit: number;
  categoryId?: string;
  categoryName?: string;
  categoryLimit: number;
  effectiveLimit: number;
}

export class DiscountRulesService {
  constructor(private readonly repository: DiscountRulesRepository = discountRulesRepository) {}

  // --- Customer Tier Discount Rules ---

  async listTierRules(query: DiscountRuleQueryInput): Promise<PaginatedTierRules> {
    return this.repository.findAllTierRules(query);
  }

  async getTierRuleById(id: string): Promise<CustomerTierRuleWithTier> {
    const rule = await this.repository.findTierRuleById(id);
    if (!rule) {
      throw new NotFoundError(`Customer tier discount rule with ID '${id}' not found`);
    }
    return rule;
  }

  async createTierRule(data: CreateCustomerTierDiscountRuleInput): Promise<CustomerTierDiscountRule> {
    // 1. Verify customer tier exists and is active
    const tier = await customerTiersRepository.findById(data.customerTierId);
    if (!tier) {
      throw new NotFoundError(`Customer tier with ID '${data.customerTierId}' not found`);
    }
    if (!tier.isActive) {
      throw new BadRequestError(`Cannot create discount rule for inactive customer tier '${tier.name}'`);
    }

    // 2. Verify tier does not already have a discount rule
    const existing = await this.repository.findTierRuleByTierId(data.customerTierId);
    if (existing) {
      throw new ConflictError(
        `Discount rule for customer tier '${tier.name}' already exists (ID: ${existing.id})`
      );
    }

    return this.repository.createTierRule({
      customerTierId: data.customerTierId,
      maxDiscountPercent: data.maxDiscountPercent,
      isActive: data.isActive ?? true,
    });
  }

  async updateTierRule(
    id: string,
    data: UpdateCustomerTierDiscountRuleInput
  ): Promise<CustomerTierDiscountRule> {
    await this.getTierRuleById(id);

    const updated = await this.repository.updateTierRule(id, {
      ...(data.maxDiscountPercent ? { maxDiscountPercent: data.maxDiscountPercent } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    if (!updated) {
      throw new NotFoundError(`Customer tier discount rule with ID '${id}' not found`);
    }

    return updated;
  }

  async deleteTierRule(id: string): Promise<void> {
    await this.getTierRuleById(id);

    const deleted = await this.repository.deleteTierRule(id);
    if (!deleted) {
      throw new NotFoundError(`Customer tier discount rule with ID '${id}' not found`);
    }
  }

  // --- Category Discount Rules ---

  async listCategoryRules(query: DiscountRuleQueryInput): Promise<PaginatedCategoryRules> {
    return this.repository.findAllCategoryRules(query);
  }

  async getCategoryRuleById(id: string): Promise<CategoryRuleWithCategory> {
    const rule = await this.repository.findCategoryRuleById(id);
    if (!rule) {
      throw new NotFoundError(`Category discount rule with ID '${id}' not found`);
    }
    return rule;
  }

  async createCategoryRule(data: CreateCategoryDiscountRuleInput): Promise<CategoryDiscountRule> {
    // 1. Verify category exists and is active
    const category = await categoriesRepository.findById(data.categoryId);
    if (!category) {
      throw new NotFoundError(`Product category with ID '${data.categoryId}' not found`);
    }
    if (!category.isActive) {
      throw new BadRequestError(`Cannot create discount rule for inactive category '${category.name}'`);
    }

    // 2. Verify category does not already have a discount rule
    const existing = await this.repository.findCategoryRuleByCategoryId(data.categoryId);
    if (existing) {
      throw new ConflictError(
        `Discount rule for product category '${category.name}' already exists (ID: ${existing.id})`
      );
    }

    return this.repository.createCategoryRule({
      categoryId: data.categoryId,
      maxDiscountPercent: data.maxDiscountPercent,
      isActive: data.isActive ?? true,
    });
  }

  async updateCategoryRule(
    id: string,
    data: UpdateCategoryDiscountRuleInput
  ): Promise<CategoryDiscountRule> {
    await this.getCategoryRuleById(id);

    const updated = await this.repository.updateCategoryRule(id, {
      ...(data.maxDiscountPercent ? { maxDiscountPercent: data.maxDiscountPercent } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    if (!updated) {
      throw new NotFoundError(`Category discount rule with ID '${id}' not found`);
    }

    return updated;
  }

  async deleteCategoryRule(id: string): Promise<void> {
    await this.getCategoryRuleById(id);

    const deleted = await this.repository.deleteCategoryRule(id);
    if (!deleted) {
      throw new NotFoundError(`Category discount rule with ID '${id}' not found`);
    }
  }

  // --- Discount Resolution Logic ---

  async getCustomerTierDiscountLimit(customerTierId: string): Promise<number> {
    const rule = await this.repository.findTierRuleByTierId(customerTierId);
    if (!rule || !rule.isActive) {
      return 0;
    }
    return parseFloat(rule.maxDiscountPercent) || 0;
  }

  async getCategoryDiscountLimit(categoryId: string): Promise<number> {
    const rule = await this.repository.findCategoryRuleByCategoryId(categoryId);
    if (!rule || !rule.isActive) {
      return 0;
    }
    return parseFloat(rule.maxDiscountPercent) || 0;
  }

  async getEffectiveDiscountLimit(params: {
    customerTierId?: string;
    categoryId?: string;
  }): Promise<EffectiveDiscountResolution> {
    let tierLimit = 0;
    let tierName: string | undefined;
    let categoryLimit = 0;
    let categoryName: string | undefined;

    if (params.customerTierId) {
      const tier = await customerTiersRepository.findById(params.customerTierId);
      if (tier) {
        tierName = tier.name;
        tierLimit = await this.getCustomerTierDiscountLimit(params.customerTierId);
      }
    }

    if (params.categoryId) {
      const category = await categoriesRepository.findById(params.categoryId);
      if (category) {
        categoryName = category.name;
        categoryLimit = await this.getCategoryDiscountLimit(params.categoryId);
      }
    }

    let effectiveLimit = 0;
    if (params.customerTierId && params.categoryId) {
      effectiveLimit = Math.min(tierLimit, categoryLimit);
    } else if (params.customerTierId) {
      effectiveLimit = tierLimit;
    } else if (params.categoryId) {
      effectiveLimit = categoryLimit;
    }

    return {
      customerTierId: params.customerTierId,
      customerTierName: tierName,
      tierLimit,
      categoryId: params.categoryId,
      categoryName,
      categoryLimit,
      effectiveLimit,
    };
  }
}

export const discountRulesService = new DiscountRulesService();
