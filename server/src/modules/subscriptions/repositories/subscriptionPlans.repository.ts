import { db, Database } from '../../../database/db.js';
import {
  subscriptionPlans,
  SubscriptionPlan,
  NewSubscriptionPlan,
} from '../../../database/schema/index.js';
import { eq, ilike, or, desc, count, and } from 'drizzle-orm';
import { SubscriptionPlanQueryInput } from '../validators/subscriptionPlans.validator.js';

export interface PaginatedSubscriptionPlans {
  items: SubscriptionPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SubscriptionPlansRepository {
  async findAll(
    query: SubscriptionPlanQueryInput,
    client: Database = db
  ): Promise<PaginatedSubscriptionPlans> {
    const { page = 1, limit = 20, search, billingInterval, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(subscriptionPlans.name, `%${search}%`),
          ilike(subscriptionPlans.code, `%${search}%`)
        )
      );
    }

    if (billingInterval) {
      conditions.push(eq(subscriptionPlans.billingInterval, billingInterval));
    }

    if (isActive !== undefined) {
      conditions.push(eq(subscriptionPlans.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await client
      .select({ count: count() })
      .from(subscriptionPlans)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const items = await client
      .select()
      .from(subscriptionPlans)
      .where(whereClause)
      .orderBy(desc(subscriptionPlans.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, client: Database = db): Promise<SubscriptionPlan | undefined> {
    const [plan] = await client
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async findByCode(code: string, client: Database = db): Promise<SubscriptionPlan | undefined> {
    const [plan] = await client
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.code, code));
    return plan;
  }

  async findByName(name: string, client: Database = db): Promise<SubscriptionPlan | undefined> {
    const [plan] = await client
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, name));
    return plan;
  }

  async create(data: NewSubscriptionPlan, client: Database = db): Promise<SubscriptionPlan> {
    const [created] = await client.insert(subscriptionPlans).values(data).returning();
    return created;
  }

  async update(
    id: string,
    data: Partial<NewSubscriptionPlan>,
    client: Database = db
  ): Promise<SubscriptionPlan | undefined> {
    const [updated] = await client
      .update(subscriptionPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, client: Database = db): Promise<boolean> {
    // Soft delete / deactivation
    const [updated] = await client
      .update(subscriptionPlans)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.id, id))
      .returning();

    return !!updated;
  }

  async getMetrics(client: Database = db): Promise<{ total: number; active: number }> {
    const all = await client.select({ isActive: subscriptionPlans.isActive }).from(subscriptionPlans);
    const total = all.length;
    const active = all.filter((p) => p.isActive).length;
    return { total, active };
  }
}

export const subscriptionPlansRepository = new SubscriptionPlansRepository();
