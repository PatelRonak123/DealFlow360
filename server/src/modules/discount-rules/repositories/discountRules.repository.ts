import { db, Database } from '../../../database/db.js';
import {
  customerTierDiscountRules,
  categoryDiscountRules,
  customerTiers,
  productCategories,
  CustomerTierDiscountRule,
  NewCustomerTierDiscountRule,
  CategoryDiscountRule,
  NewCategoryDiscountRule,
  CustomerTier,
  ProductCategory,
} from '../../../database/schema/index.js';
import { eq, and, desc, count } from 'drizzle-orm';
import { DiscountRuleQueryInput } from '../validators/discountRule.validator.js';

export interface CustomerTierRuleWithTier extends CustomerTierDiscountRule {
  customerTier?: CustomerTier;
}

export interface CategoryRuleWithCategory extends CategoryDiscountRule {
  category?: ProductCategory;
}

export interface PaginatedTierRules {
  items: CustomerTierRuleWithTier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedCategoryRules {
  items: CategoryRuleWithCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class DiscountRulesRepository {
  // --- Customer Tier Discount Rules ---

  async findAllTierRules(
    query: DiscountRuleQueryInput,
    client: Database = db
  ): Promise<PaginatedTierRules> {
    const { page = 1, limit = 20, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(customerTierDiscountRules.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await client
      .select({ count: count() })
      .from(customerTierDiscountRules)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const rows = await client
      .select({
        rule: customerTierDiscountRules,
        tier: customerTiers,
      })
      .from(customerTierDiscountRules)
      .leftJoin(customerTiers, eq(customerTierDiscountRules.customerTierId, customerTiers.id))
      .where(whereClause)
      .orderBy(desc(customerTierDiscountRules.createdAt))
      .limit(limit)
      .offset(offset);

    const items: CustomerTierRuleWithTier[] = rows.map((r) => ({
      ...r.rule,
      customerTier: r.tier || undefined,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findTierRuleById(
    id: string,
    client: Database = db
  ): Promise<CustomerTierRuleWithTier | undefined> {
    const row = await client.query.customerTierDiscountRules.findFirst({
      where: eq(customerTierDiscountRules.id, id),
      with: {
        customerTier: true,
      },
    });

    return row as CustomerTierRuleWithTier | undefined;
  }

  async findTierRuleByTierId(
    tierId: string,
    client: Database = db
  ): Promise<CustomerTierDiscountRule | undefined> {
    return client.query.customerTierDiscountRules.findFirst({
      where: eq(customerTierDiscountRules.customerTierId, tierId),
    });
  }

  async createTierRule(
    data: NewCustomerTierDiscountRule,
    client: Database = db
  ): Promise<CustomerTierDiscountRule> {
    const [created] = await client.insert(customerTierDiscountRules).values(data).returning();
    return created;
  }

  async updateTierRule(
    id: string,
    data: Partial<NewCustomerTierDiscountRule>,
    client: Database = db
  ): Promise<CustomerTierDiscountRule | undefined> {
    const [updated] = await client
      .update(customerTierDiscountRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customerTierDiscountRules.id, id))
      .returning();

    return updated;
  }

  async deleteTierRule(id: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(customerTierDiscountRules)
      .where(eq(customerTierDiscountRules.id, id))
      .returning();

    return result.length > 0;
  }

  // --- Category Discount Rules ---

  async findAllCategoryRules(
    query: DiscountRuleQueryInput,
    client: Database = db
  ): Promise<PaginatedCategoryRules> {
    const { page = 1, limit = 20, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(categoryDiscountRules.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await client
      .select({ count: count() })
      .from(categoryDiscountRules)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const rows = await client
      .select({
        rule: categoryDiscountRules,
        category: productCategories,
      })
      .from(categoryDiscountRules)
      .leftJoin(productCategories, eq(categoryDiscountRules.categoryId, productCategories.id))
      .where(whereClause)
      .orderBy(desc(categoryDiscountRules.createdAt))
      .limit(limit)
      .offset(offset);

    const items: CategoryRuleWithCategory[] = rows.map((r) => ({
      ...r.rule,
      category: r.category || undefined,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findCategoryRuleById(
    id: string,
    client: Database = db
  ): Promise<CategoryRuleWithCategory | undefined> {
    const row = await client.query.categoryDiscountRules.findFirst({
      where: eq(categoryDiscountRules.id, id),
      with: {
        category: true,
      },
    });

    return row as CategoryRuleWithCategory | undefined;
  }

  async findCategoryRuleByCategoryId(
    categoryId: string,
    client: Database = db
  ): Promise<CategoryDiscountRule | undefined> {
    return client.query.categoryDiscountRules.findFirst({
      where: eq(categoryDiscountRules.categoryId, categoryId),
    });
  }

  async createCategoryRule(
    data: NewCategoryDiscountRule,
    client: Database = db
  ): Promise<CategoryDiscountRule> {
    const [created] = await client.insert(categoryDiscountRules).values(data).returning();
    return created;
  }

  async updateCategoryRule(
    id: string,
    data: Partial<NewCategoryDiscountRule>,
    client: Database = db
  ): Promise<CategoryDiscountRule | undefined> {
    const [updated] = await client
      .update(categoryDiscountRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(categoryDiscountRules.id, id))
      .returning();

    return updated;
  }

  async deleteCategoryRule(id: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(categoryDiscountRules)
      .where(eq(categoryDiscountRules.id, id))
      .returning();

    return result.length > 0;
  }
}

export const discountRulesRepository = new DiscountRulesRepository();
