import { db, Database } from '../../../database/db.js';
import {
  quotations,
  quotationItems,
  customers,
  customerTiers,
  priceLists,
  users,
  Quotation,
  NewQuotation,
  QuotationItem,
  NewQuotationItem,
  Customer,
  CustomerTier,
  PriceList,
  User,
  Product,
} from '../../../database/schema/index.js';
import { eq, ilike, and, or, sql, desc, count, inArray } from 'drizzle-orm';
import { QuotationQueryInput } from '../validators/quotation.validator.js';

export interface QuotationItemWithProduct extends QuotationItem {
  product?: Product;
}

export interface QuotationWithDetails extends Quotation {
  customer?: Customer & { customerTier?: CustomerTier };
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

interface CachedQuotations {
  data: PaginatedQuotations;
  expiresAt: number;
}

const quotationsCache = new Map<string, CachedQuotations>();
const inFlightQuotations = new Map<string, Promise<PaginatedQuotations>>();
const QUOTATIONS_CACHE_TTL_MS = 30 * 1000; // 30 seconds high performance read cache

export class QuotationsRepository {
  invalidateCache(): void {
    quotationsCache.clear();
  }

  async generateNextQuotationNumber(client: Database = db): Promise<string> {
    const result = await client.execute(sql`SELECT nextval('quotation_number_seq') as seq_num`);
    const row = result.rows[0] as { seq_num: string | number };
    const num = Number(row.seq_num);
    return `QT-${String(num).padStart(6, '0')}`;
  }

  async generateNextRevisionNumber(parentQuotationNumber: string, client: Database = db): Promise<string> {
    const baseNumber = parentQuotationNumber.replace(/-R\d+$/i, '');
    const pattern = `${baseNumber}-R%`;
    const existing = await client
      .select({ quotationNumber: quotations.quotationNumber })
      .from(quotations)
      .where(ilike(quotations.quotationNumber, pattern));

    let maxRev = 0;
    const regex = new RegExp(`^${baseNumber}-R(\\d+)$`, 'i');
    for (const row of existing) {
      const match = row.quotationNumber.match(regex);
      if (match) {
        const revNum = parseInt(match[1], 10);
        if (revNum > maxRev) maxRev = revNum;
      }
    }
    return `${baseNumber}-R${maxRev + 1}`;
  }

  async findAll(
    query: QuotationQueryInput,
    userOwnershipId?: string,
    client: Database = db
  ): Promise<PaginatedQuotations> {
    const cacheKey = JSON.stringify({ query, userOwnershipId });
    const cached = quotationsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    if (inFlightQuotations.has(cacheKey)) {
      return inFlightQuotations.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<PaginatedQuotations> => {
      try {
        const { page = 1, limit = 20, search, status, customerId, createdBy } = query;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (userOwnershipId) {
          conditions.push(eq(quotations.createdBy, userOwnershipId));
        } else if (createdBy) {
          conditions.push(eq(quotations.createdBy, createdBy));
        }

        if (status && status.length > 0) {
          if (status.length === 1) {
            conditions.push(eq(quotations.status, status[0]));
          } else {
            conditions.push(inArray(quotations.status, status));
          }
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

        // Single-pass query: Fetch paginated quotations and total window count in ONE round-trip
        const rows = await client
          .select({
            quotation: quotations,
            customer: customers,
            customerTier: customerTiers,
            priceList: priceLists,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
            fullCount: sql<string>`count(*) over()`,
          })
          .from(quotations)
          .leftJoin(customers, eq(quotations.customerId, customers.id))
          .leftJoin(customerTiers, eq(customers.customerTierId, customerTiers.id))
          .leftJoin(priceLists, eq(quotations.priceListId, priceLists.id))
          .leftJoin(users, eq(quotations.createdBy, users.id))
          .where(whereClause)
          .orderBy(desc(quotations.createdAt))
          .limit(limit)
          .offset(offset);

        let total = 0;
        if (rows.length > 0) {
          total = Number(rows[0].fullCount || 0);
        } else if (page > 1) {
          // Only fallback to a count query if an out-of-bounds page returned 0 rows
          const [totalResult] = await client
            .select({ count: count() })
            .from(quotations)
            .where(whereClause);
          total = Number(totalResult?.count || 0);
        }

        const items: QuotationWithDetails[] = rows.map((r) => ({
          ...r.quotation,
          customer: r.customer
            ? {
                ...r.customer,
                customerTier: r.customerTier || undefined,
              }
            : undefined,
          priceList: r.priceList || undefined,
          createdByUser: r.user && r.user.id ? (r.user as Pick<User, 'id' | 'name' | 'email'>) : undefined,
        }));

        const result: PaginatedQuotations = {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };

        quotationsCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + QUOTATIONS_CACHE_TTL_MS,
        });

        return result;
      } finally {
        inFlightQuotations.delete(cacheKey);
      }
    })();

    inFlightQuotations.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async findById(id: string, client: Database = db): Promise<QuotationWithDetails | undefined> {
    const row = await client.query.quotations.findFirst({
      where: eq(quotations.id, id),
      with: {
        customer: {
          with: {
            customerTier: true,
          },
        },
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
    this.invalidateCache();
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

    this.invalidateCache();
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
    this.invalidateCache();
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

    this.invalidateCache();
    return updated;
  }

  async deleteItem(itemId: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(quotationItems)
      .where(eq(quotationItems.id, itemId))
      .returning();

    if (result.length > 0) {
      this.invalidateCache();
      return true;
    }
    return false;
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

    this.invalidateCache();
    return updated;
  }
}

export const quotationsRepository = new QuotationsRepository();
