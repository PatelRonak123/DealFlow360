import { db, Database } from '../../../database/db.js';
import {
  customerTiers,
  customers,
  CustomerTier,
  NewCustomerTier,
} from '../../../database/schema/index.js';
import { eq, ilike, and, sql, desc, count } from 'drizzle-orm';
import { CustomerTierQueryInput } from '../validators/customerTier.validator.js';

export interface PaginatedCustomerTiers {
  items: CustomerTier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CustomerTiersRepository {
  async findAll(
    query: CustomerTierQueryInput,
    client: Database = db
  ): Promise<PaginatedCustomerTiers> {
    const { page = 1, limit = 20, search, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(ilike(customerTiers.name, `%${search}%`));
    }

    if (isActive !== undefined) {
      conditions.push(eq(customerTiers.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await client
      .select({ count: count() })
      .from(customerTiers)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const items = await client
      .select()
      .from(customerTiers)
      .where(whereClause)
      .orderBy(desc(customerTiers.createdAt))
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

  async findById(id: string, client: Database = db): Promise<CustomerTier | undefined> {
    return client.query.customerTiers.findFirst({
      where: eq(customerTiers.id, id),
    });
  }

  async findByName(name: string, client: Database = db): Promise<CustomerTier | undefined> {
    const normalized = name.trim();
    return client.query.customerTiers.findFirst({
      where: sql`lower(${customerTiers.name}) = lower(${normalized})`,
    });
  }

  async countActiveCustomers(tierId: string, client: Database = db): Promise<number> {
    const [result] = await client
      .select({ count: count() })
      .from(customers)
      .where(and(eq(customers.customerTierId, tierId), eq(customers.status, 'ACTIVE')));

    return Number(result?.count || 0);
  }

  async create(data: NewCustomerTier, client: Database = db): Promise<CustomerTier> {
    const [created] = await client.insert(customerTiers).values(data).returning();
    return created;
  }

  async update(
    id: string,
    data: Partial<NewCustomerTier>,
    client: Database = db
  ): Promise<CustomerTier | undefined> {
    const [updated] = await client
      .update(customerTiers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customerTiers.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(customerTiers)
      .where(eq(customerTiers.id, id))
      .returning();

    return result.length > 0;
  }
}

export const customerTiersRepository = new CustomerTiersRepository();
