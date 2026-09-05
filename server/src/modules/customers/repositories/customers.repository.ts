import { db, Database } from '../../../database/db.js';
import {
  customers,
  customerTiers,
  Customer,
  NewCustomer,
  CustomerTier,
} from '../../../database/schema/index.js';
import { eq, ilike, and, or, desc, count } from 'drizzle-orm';
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

export class CustomersRepository {
  async findAll(
    query: CustomerQueryInput,
    client: Database = db
  ): Promise<PaginatedCustomers> {
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

    const [totalResult] = await client
      .select({ count: count() })
      .from(customers)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const rows = await client
      .select({
        customer: customers,
        tier: customerTiers,
      })
      .from(customers)
      .leftJoin(customerTiers, eq(customers.customerTierId, customerTiers.id))
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    const items: CustomerWithTier[] = rows.map((r) => ({
      ...r.customer,
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

    return updated;
  }

  async delete(id: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(customers)
      .where(eq(customers.id, id))
      .returning();

    return result.length > 0;
  }
}

export const customersRepository = new CustomersRepository();
