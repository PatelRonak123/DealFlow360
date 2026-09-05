import { and, eq, inArray, count, desc } from 'drizzle-orm';
import { db, Database, DbClient } from '../../../database/db.js';
import {
  recommendationRules,
  RecommendationRule,
  NewRecommendationRule,
} from '../../../database/schema/recommendationRules.js';
import {
  recommendationEvents,
  RecommendationEvent,
  NewRecommendationEvent,
} from '../../../database/schema/recommendationEvents.js';
import { products } from '../../../database/schema/products.js';
import { productCategories } from '../../../database/schema/productCategories.js';
import { ListRecommendationRulesQuery } from '../types/index.js';
import { RecommendationEventTypes } from '../constants/recommendationEvents.js';

export class RecommendationsRepository {
  constructor(private readonly defaultDb: Database = db) {}

  private getClient(client?: DbClient): DbClient {
    return client || this.defaultDb;
  }

  // --- Recommendation Rules CRUD ---

  async createRule(
    data: NewRecommendationRule,
    client?: DbClient
  ): Promise<RecommendationRule> {
    const trx = this.getClient(client);
    const [created] = await trx
      .insert(recommendationRules)
      .values(data)
      .returning();
    return created;
  }

  async findRuleById(
    id: string,
    client?: DbClient
  ): Promise<RecommendationRule | null> {
    const trx = this.getClient(client);
    const [found] = await trx
      .select()
      .from(recommendationRules)
      .where(eq(recommendationRules.id, id));
    return found || null;
  }

  async findDuplicateRule(
    sourceProductId: string,
    recommendedProductId: string,
    client?: DbClient
  ): Promise<RecommendationRule | null> {
    const trx = this.getClient(client);
    const [found] = await trx
      .select()
      .from(recommendationRules)
      .where(
        and(
          eq(recommendationRules.sourceProductId, sourceProductId),
          eq(recommendationRules.recommendedProductId, recommendedProductId)
        )
      );
    return found || null;
  }

  async updateRule(
    id: string,
    data: Partial<NewRecommendationRule>,
    client?: DbClient
  ): Promise<RecommendationRule | null> {
    const trx = this.getClient(client);
    const [updated] = await trx
      .update(recommendationRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(recommendationRules.id, id))
      .returning();
    return updated || null;
  }

  async deleteRule(id: string, client?: DbClient): Promise<boolean> {
    const trx = this.getClient(client);
    const deleted = await trx
      .delete(recommendationRules)
      .where(eq(recommendationRules.id, id))
      .returning();
    return deleted.length > 0;
  }

  async listRules(query: ListRecommendationRulesQuery, client?: DbClient) {
    const trx = this.getClient(client);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.sourceProductId) {
      conditions.push(eq(recommendationRules.sourceProductId, query.sourceProductId));
    }
    if (query.recommendedProductId) {
      conditions.push(eq(recommendationRules.recommendedProductId, query.recommendedProductId));
    }
    if (query.recommendationType) {
      conditions.push(eq(recommendationRules.recommendationType, query.recommendationType));
    }
    if (query.priority) {
      conditions.push(eq(recommendationRules.priority, query.priority));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(recommendationRules.isActive, query.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await trx
      .select({ count: count() })
      .from(recommendationRules)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const sourceProducts = trx
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
      })
      .from(products)
      .as('sourceProducts');

    const recommendedProducts = trx
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        basePrice: products.basePrice,
        currency: products.currency,
        isActive: products.isActive,
      })
      .from(products)
      .as('recommendedProducts');

    const rules = await trx
      .select({
        id: recommendationRules.id,
        sourceProductId: recommendationRules.sourceProductId,
        recommendedProductId: recommendationRules.recommendedProductId,
        recommendationType: recommendationRules.recommendationType,
        priority: recommendationRules.priority,
        defaultQuantity: recommendationRules.defaultQuantity,
        description: recommendationRules.description,
        isActive: recommendationRules.isActive,
        createdAt: recommendationRules.createdAt,
        updatedAt: recommendationRules.updatedAt,
        sourceProduct: {
          id: sourceProducts.id,
          name: sourceProducts.name,
          sku: sourceProducts.sku,
        },
        recommendedProduct: {
          id: recommendedProducts.id,
          name: recommendedProducts.name,
          sku: recommendedProducts.sku,
          basePrice: recommendedProducts.basePrice,
          currency: recommendedProducts.currency,
          isActive: recommendedProducts.isActive,
        },
      })
      .from(recommendationRules)
      .leftJoin(sourceProducts, eq(recommendationRules.sourceProductId, sourceProducts.id))
      .leftJoin(
        recommendedProducts,
        eq(recommendationRules.recommendedProductId, recommendedProducts.id)
      )
      .where(whereClause)
      .orderBy(desc(recommendationRules.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      rules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --- Recommendation Engine Queries ---

  async findActiveRulesBySourceProductIds(
    sourceProductIds: string[],
    client?: DbClient
  ) {
    if (sourceProductIds.length === 0) return [];
    const trx = this.getClient(client);

    const sourceAlias = trx
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
      })
      .from(products)
      .as('sourceAlias');

    const recAlias = trx
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        productType: products.productType,
        categoryId: products.categoryId,
        basePrice: products.basePrice,
        currency: products.currency,
        isActive: products.isActive,
      })
      .from(products)
      .as('recAlias');

    return await trx
      .select({
        rule: recommendationRules,
        sourceProduct: {
          id: sourceAlias.id,
          name: sourceAlias.name,
          sku: sourceAlias.sku,
        },
        recommendedProduct: {
          id: recAlias.id,
          name: recAlias.name,
          sku: recAlias.sku,
          description: recAlias.description,
          productType: recAlias.productType,
          categoryId: recAlias.categoryId,
          categoryName: productCategories.name,
          basePrice: recAlias.basePrice,
          currency: recAlias.currency,
          isActive: recAlias.isActive,
        },
      })
      .from(recommendationRules)
      .innerJoin(sourceAlias, eq(recommendationRules.sourceProductId, sourceAlias.id))
      .innerJoin(recAlias, eq(recommendationRules.recommendedProductId, recAlias.id))
      .leftJoin(productCategories, eq(recAlias.categoryId, productCategories.id))
      .where(
        and(
          inArray(recommendationRules.sourceProductId, sourceProductIds),
          eq(recommendationRules.isActive, true),
          eq(recAlias.isActive, true)
        )
      );
  }

  // --- Recommendation Tracking Events ---

  async recordEvent(
    data: NewRecommendationEvent,
    client?: DbClient
  ): Promise<RecommendationEvent> {
    const trx = this.getClient(client);
    const [created] = await trx
      .insert(recommendationEvents)
      .values(data)
      .returning();
    return created;
  }

  async getDismissedProductIdsForQuotation(
    quotationId: string,
    client?: DbClient
  ): Promise<string[]> {
    const trx = this.getClient(client);
    const events = await trx
      .select({ productId: recommendationEvents.recommendedProductId })
      .from(recommendationEvents)
      .where(
        and(
          eq(recommendationEvents.quotationId, quotationId),
          eq(recommendationEvents.eventType, RecommendationEventTypes.DISMISSED)
        )
      );
    return events.map((e) => e.productId);
  }

  async getEventsByQuotationId(
    quotationId: string,
    client?: DbClient
  ): Promise<RecommendationEvent[]> {
    const trx = this.getClient(client);
    return await trx
      .select()
      .from(recommendationEvents)
      .where(eq(recommendationEvents.quotationId, quotationId))
      .orderBy(desc(recommendationEvents.createdAt));
  }
}

export const recommendationsRepository = new RecommendationsRepository();
