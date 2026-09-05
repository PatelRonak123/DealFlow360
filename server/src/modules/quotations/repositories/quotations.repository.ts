import { db, Database } from '../../../database/db.js';
import {
  quotations,
  quotationItems,
  customers,
  priceLists,
  users,
  Quotation,
  NewQuotation,
  QuotationItem,
  NewQuotationItem,
  Customer,
  PriceList,
  User,
  Product,
} from '../../../database/schema/index.js';
import { eq, ilike, and, or, sql, desc, count } from 'drizzle-orm';
import { QuotationQueryInput } from '../validators/quotation.validator.js';

export interface QuotationItemWithProduct extends QuotationItem {
  product?: Product;
}

export interface QuotationWithDetails extends Quotation {
  customer?: Customer;
  priceList?: PriceList;
  createdByUser?: Pick<User, 'id' | 'name' | 'email'>;
  items?: QuotationItemWithProduct[];
}

export interface PaginatedQuotations {
  items: QuotationWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class QuotationsRepository {
  async generateNextQuotationNumber(client: Database = db): Promise<string> {
    const result = await client.execute(sql`SELECT nextval('quotation_number_seq') as seq_num`);
    const row = result.rows[0] as { seq_num: string | number };
    const num = Number(row.seq_num);
    return `QT-${String(num).padStart(6, '0')}`;
  }

  async findAll(
    query: QuotationQueryInput,
    userOwnershipId?: string,
    client: Database = db
  ): Promise<PaginatedQuotations> {
    const { page = 1, limit = 20, search, status, customerId, createdBy } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (userOwnershipId) {
      conditions.push(eq(quotations.createdBy, userOwnershipId));
    } else if (createdBy) {
      conditions.push(eq(quotations.createdBy, createdBy));
    }

    if (status) {
      conditions.push(eq(quotations.status, status));
    }

    if (customerId) {
      conditions.push(eq(quotations.customerId, customerId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(quotations.quotationNumber, `%${search}%`),
          ilike(customers.companyName, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await client
      .select({ count: count() })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const rows = await client
      .select({
        quotation: quotations,
        customer: customers,
        priceList: priceLists,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(quotations)
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(priceLists, eq(quotations.priceListId, priceLists.id))
      .leftJoin(users, eq(quotations.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(quotations.createdAt))
      .limit(limit)
      .offset(offset);

    const items: QuotationWithDetails[] = rows.map((r) => ({
      ...r.quotation,
      customer: r.customer || undefined,
      priceList: r.priceList || undefined,
      createdByUser: r.user && r.user.id ? (r.user as Pick<User, 'id' | 'name' | 'email'>) : undefined,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string, client: Database = db): Promise<QuotationWithDetails | undefined> {
    const row = await client.query.quotations.findFirst({
      where: eq(quotations.id, id),
      with: {
        customer: true,
        priceList: true,
        createdByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          with: {
            product: true,
          },
          orderBy: (items, { asc }) => [asc(items.createdAt)],
        },
      },
    });

    return row as QuotationWithDetails | undefined;
  }

  async create(data: NewQuotation, client: Database = db): Promise<Quotation> {
    const [created] = await client.insert(quotations).values(data).returning();
    return created;
  }

  async update(
    id: string,
    data: Partial<NewQuotation>,
    client: Database = db
  ): Promise<Quotation | undefined> {
    const [updated] = await client
      .update(quotations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, id))
      .returning();

    return updated;
  }

  // --- Quotation Items ---

  async findItemById(itemId: string, client: Database = db): Promise<QuotationItemWithProduct | undefined> {
    const row = await client.query.quotationItems.findFirst({
      where: eq(quotationItems.id, itemId),
      with: {
        product: true,
      },
    });

    return row as QuotationItemWithProduct | undefined;
  }

  async findItemsByQuotationId(
    quotationId: string,
    client: Database = db
  ): Promise<QuotationItem[]> {
    return client.query.quotationItems.findMany({
      where: eq(quotationItems.quotationId, quotationId),
    });
  }

  async createItem(data: NewQuotationItem, client: Database = db): Promise<QuotationItem> {
    const [created] = await client.insert(quotationItems).values(data).returning();
    return created;
  }

  async updateItem(
    itemId: string,
    data: Partial<NewQuotationItem>,
    client: Database = db
  ): Promise<QuotationItem | undefined> {
    const [updated] = await client
      .update(quotationItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(quotationItems.id, itemId))
      .returning();

    return updated;
  }

  async deleteItem(itemId: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(quotationItems)
      .where(eq(quotationItems.id, itemId))
      .returning();

    return result.length > 0;
  }

  async recalculateAndSaveTotals(quotationId: string, client: Database = db): Promise<Quotation> {
    const items = await client.query.quotationItems.findMany({
      where: eq(quotationItems.quotationId, quotationId),
    });

    let subtotalNum = 0;
    let discountAmountNum = 0;
    let totalAmountNum = 0;

    for (const item of items) {
      subtotalNum += parseFloat(item.grossAmount) || 0;
      discountAmountNum += parseFloat(item.discountAmount) || 0;
      totalAmountNum += parseFloat(item.netAmount) || 0;
    }

    const [updated] = await client
      .update(quotations)
      .set({
        subtotal: subtotalNum.toFixed(2),
        discountAmount: discountAmountNum.toFixed(2),
        totalAmount: totalAmountNum.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId))
      .returning();

    return updated;
  }
}

export const quotationsRepository = new QuotationsRepository();
