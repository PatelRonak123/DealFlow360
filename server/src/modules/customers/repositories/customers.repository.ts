import { db, Database } from '../../../database/db.js';
import {
  customers,
  customerTiers,
  Customer,
  NewCustomer,
  CustomerTier,
} from '../../../database/schema/index.js';
import { eq, ilike, and, or, desc, count, sql } from 'drizzle-orm';
import { CustomerQueryInput } from '../validators/customer.validator.js';

export interface CustomerWithTier extends Customer {
  customerTier?: CustomerTier;
}

export interface PaginatedCustomers {
  items: CustomerWithTier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CachedCustomers {
  data: PaginatedCustomers;
  expiresAt: number;
}

const customersCache = new Map<string, CachedCustomers>();
const inFlightCustomers = new Map<string, Promise<PaginatedCustomers>>();
const CUSTOMERS_CACHE_TTL_MS = 60 * 1000; // 60 seconds fast cache

export class CustomersRepository {
  invalidateCache(): void {
    customersCache.clear();
  }

  async findAll(
    query: CustomerQueryInput,
    client: Database = db
  ): Promise<PaginatedCustomers> {
    const cacheKey = JSON.stringify(query);
    const cached = customersCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    if (inFlightCustomers.has(cacheKey)) {
      return inFlightCustomers.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<PaginatedCustomers> => {
      try {
        const { page = 1, limit = 20, search, customerTierId, status } = query;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
          conditions.push(
            or(
              ilike(customers.companyName, `%${search}%`),
              ilike(customers.contactName, `%${search}%`),
              ilike(customers.email, `%${search}%`)
            )
          );
        }

        if (customerTierId) {
          conditions.push(eq(customers.customerTierId, customerTierId));
        }

        if (status) {
          conditions.push(eq(customers.status, status));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Single-pass query with window count
        const rows = await client
          .select({
            customer: customers,
            tier: customerTiers,
            fullCount: sql<string>`count(*) over()`,
          })
          .from(customers)
          .leftJoin(customerTiers, eq(customers.customerTierId, customerTiers.id))
          .where(whereClause)
          .orderBy(desc(customers.createdAt))
          .limit(limit)
          .offset(offset);

        let total = 0;
        if (rows.length > 0) {
          total = Number(rows[0].fullCount || 0);
        } else if (page > 1) {
          const [totalResult] = await client
            .select({ count: count() })
            .from(customers)
            .where(whereClause);
          total = Number(totalResult?.count || 0);
        }

        const items: CustomerWithTier[] = rows.map((r) => ({
          ...r.customer,
          customerTier: r.tier || undefined,
        }));

        const result: PaginatedCustomers = {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };

        customersCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + CUSTOMERS_CACHE_TTL_MS,
        });

        return result;
      } finally {
        inFlightCustomers.delete(cacheKey);
      }
    })();

    inFlightCustomers.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async findById(id: string, client: Database = db): Promise<CustomerWithTier | undefined> {
    const row = await client.query.customers.findFirst({
      where: eq(customers.id, id),
      with: {
        customerTier: true,
      },
    });

    return row as CustomerWithTier | undefined;
  }

  async create(data: NewCustomer, client: Database = db): Promise<Customer> {
    const [created] = await client.insert(customers).values(data).returning();
    this.invalidateCache();
    return created;
  }

  async update(
    id: string,
    data: Partial<NewCustomer>,
    client: Database = db
  ): Promise<Customer | undefined> {
    const [updated] = await client
      .update(customers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    this.invalidateCache();
    return updated;
  }

  async delete(id: string, client: Database = db): Promise<boolean> {
    const [updated] = await client
      .update(customers)
      .set({
        status: 'INACTIVE',
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    this.invalidateCache();
    return !!updated;
  }
}

export const customersRepository = new CustomersRepository();
