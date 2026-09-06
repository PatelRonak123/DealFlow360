import { db, Database } from '../../../database/db.js';
import {
  priceLists,
  priceListItems,
  products,
  PriceList,
  NewPriceList,
  PriceListItem,
  NewPriceListItem,
  Product,
} from '../../../database/schema/index.js';
import { eq, ilike, and, sql, desc, count } from 'drizzle-orm';
import {
  PriceListQueryInput,
  PriceListItemQueryInput,
} from '../validators/priceList.validator.js';

export interface PaginatedPriceLists {
  items: PriceList[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PriceListItemWithProduct extends PriceListItem {
  product?: Product;
}

export interface PaginatedPriceListItems {
  items: PriceListItemWithProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CachedPriceLists {
  data: PaginatedPriceLists;
  expiresAt: number;
}

const priceListsCache = new Map<string, CachedPriceLists>();
const inFlightPriceLists = new Map<string, Promise<PaginatedPriceLists>>();
const PRICE_LISTS_CACHE_TTL_MS = 60 * 1000; // 60 seconds fast cache

export class PriceListsRepository {
  invalidateCache(): void {
    priceListsCache.clear();
  }

  async findAll(
    query: PriceListQueryInput,
    client: Database = db
  ): Promise<PaginatedPriceLists> {
    const cacheKey = JSON.stringify(query);
    const cached = priceListsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    if (inFlightPriceLists.has(cacheKey)) {
      return inFlightPriceLists.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<PaginatedPriceLists> => {
      try {
        const { page = 1, limit = 20, search, currency, isDefault, isActive } = query;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
          conditions.push(ilike(priceLists.name, `%${search}%`));
        }

        if (currency) {
          conditions.push(eq(priceLists.currency, currency.toUpperCase()));
        }

        if (isDefault !== undefined) {
          conditions.push(eq(priceLists.isDefault, isDefault));
        }

        if (isActive !== undefined) {
          conditions.push(eq(priceLists.isActive, isActive));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Single-pass query with window count
        const rows = await client
          .select({
            priceList: priceLists,
            fullCount: sql<string>`count(*) over()`,
          })
          .from(priceLists)
          .where(whereClause)
          .orderBy(desc(priceLists.isDefault), desc(priceLists.createdAt))
          .limit(limit)
          .offset(offset);

        let total = 0;
        if (rows.length > 0) {
          total = Number(rows[0].fullCount || 0);
        } else if (page > 1) {
          const [totalResult] = await client
            .select({ count: count() })
            .from(priceLists)
            .where(whereClause);
          total = Number(totalResult?.count || 0);
        }

        const items = rows.map((r) => r.priceList);

        const result: PaginatedPriceLists = {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };

        priceListsCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + PRICE_LISTS_CACHE_TTL_MS,
        });

        return result;
      } finally {
        inFlightPriceLists.delete(cacheKey);
      }
    })();

    inFlightPriceLists.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async findById(id: string, client: Database = db): Promise<PriceList | undefined> {
    return client.query.priceLists.findFirst({
      where: eq(priceLists.id, id),
    });
  }

  async findByName(name: string, client: Database = db): Promise<PriceList | undefined> {
    const normalized = name.trim();
    return client.query.priceLists.findFirst({
      where: sql`lower(${priceLists.name}) = lower(${normalized})`,
    });
  }

  async findDefaultByCurrency(currency: string, client: Database = db): Promise<PriceList | undefined> {
    const normalized = currency.trim().toUpperCase();
    return client.query.priceLists.findFirst({
      where: and(
        eq(priceLists.currency, normalized),
        eq(priceLists.isDefault, true),
        eq(priceLists.isActive, true)
      ),
    });
  }

  async create(data: NewPriceList, client: Database = db): Promise<PriceList> {
    if (data.isDefault) {
      // Demote existing default price lists for this currency
      await client
        .update(priceLists)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(priceLists.currency, data.currency || 'INR'),
            eq(priceLists.isDefault, true)
          )
        );
    }

    const [created] = await client.insert(priceLists).values(data).returning();
    this.invalidateCache();
    return created;
  }

  async update(
    id: string,
    data: Partial<NewPriceList>,
    currency: string,
    client: Database = db
  ): Promise<PriceList | undefined> {
    if (data.isDefault) {
      // Demote existing default price lists for this currency
      await client
        .update(priceLists)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(priceLists.currency, currency),
            eq(priceLists.isDefault, true)
          )
        );
    }

    const [updated] = await client
      .update(priceLists)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(priceLists.id, id))
      .returning();

    this.invalidateCache();
    return updated;
  }

  async delete(id: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(priceLists)
      .where(eq(priceLists.id, id))
      .returning();

    this.invalidateCache();
    return result.length > 0;
  }

  // --- Price List Items Methods ---

  async findItem(
    priceListId: string,
    productId: string,
    client: Database = db
  ): Promise<PriceListItem | undefined> {
    return client.query.priceListItems.findFirst({
      where: and(
        eq(priceListItems.priceListId, priceListId),
        eq(priceListItems.productId, productId)
      ),
    });
  }

  async findItemById(itemId: string, client: Database = db): Promise<PriceListItemWithProduct | undefined> {
    const row = await client.query.priceListItems.findFirst({
      where: eq(priceListItems.id, itemId),
      with: {
        product: true,
      },
    });

    return row as PriceListItemWithProduct | undefined;
  }

  async findItemsByPriceList(
    priceListId: string,
    query: PriceListItemQueryInput,
    client: Database = db
  ): Promise<PaginatedPriceListItems> {
    const { page = 1, limit = 50 } = query;
    const offset = (page - 1) * limit;

    const whereClause = eq(priceListItems.priceListId, priceListId);

    const [totalResult] = await client
      .select({ count: count() })
      .from(priceListItems)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const rows = await client
      .select({
        item: priceListItems,
        product: products,
      })
      .from(priceListItems)
      .leftJoin(products, eq(priceListItems.productId, products.id))
      .where(whereClause)
      .orderBy(desc(priceListItems.createdAt))
      .limit(limit)
      .offset(offset);

    const items: PriceListItemWithProduct[] = rows.map((r) => ({
      ...r.item,
      product: r.product || undefined,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async createItem(data: NewPriceListItem, client: Database = db): Promise<PriceListItem> {
    const [created] = await client.insert(priceListItems).values(data).returning();
    return created;
  }

  async updateItem(
    itemId: string,
    price: string,
    client: Database = db
  ): Promise<PriceListItem | undefined> {
    const [updated] = await client
      .update(priceListItems)
      .set({
        price,
        updatedAt: new Date(),
      })
      .where(eq(priceListItems.id, itemId))
      .returning();

    return updated;
  }

  async deleteItem(itemId: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(priceListItems)
      .where(eq(priceListItems.id, itemId))
      .returning();

    return result.length > 0;
  }
}

export const priceListsRepository = new PriceListsRepository();
