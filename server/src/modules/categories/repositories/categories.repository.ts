import { db, Database } from '../../../database/db.js';
import {
  productCategories,
  products,
  ProductCategory,
  NewProductCategory,
} from '../../../database/schema/index.js';
import { eq, ilike, and, sql, desc, count } from 'drizzle-orm';
import { CategoryQueryInput } from '../validators/category.validator.js';

export interface PaginatedCategories {
  items: ProductCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CategoriesRepository {
  async findAll(
    query: CategoryQueryInput,
    client: Database = db
  ): Promise<PaginatedCategories> {
    const { page = 1, limit = 20, search, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(ilike(productCategories.name, `%${search}%`));
    }

    if (isActive !== undefined) {
      conditions.push(eq(productCategories.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await client
      .select({ count: count() })
      .from(productCategories)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const items = await client
      .select()
      .from(productCategories)
      .where(whereClause)
      .orderBy(desc(productCategories.createdAt))
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

  async findById(id: string, client: Database = db): Promise<ProductCategory | undefined> {
    return client.query.productCategories.findFirst({
      where: eq(productCategories.id, id),
    });
  }

  async findByName(name: string, client: Database = db): Promise<ProductCategory | undefined> {
    const normalized = name.trim();
    return client.query.productCategories.findFirst({
      where: sql`lower(${productCategories.name}) = lower(${normalized})`,
    });
  }

  async countActiveProducts(categoryId: string, client: Database = db): Promise<number> {
    const [result] = await client
      .select({ count: count() })
      .from(products)
      .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)));

    return Number(result?.count || 0);
  }

  async create(data: NewProductCategory, client: Database = db): Promise<ProductCategory> {
    const [created] = await client.insert(productCategories).values(data).returning();
    return created;
  }

  async update(
    id: string,
    data: Partial<NewProductCategory>,
    client: Database = db
  ): Promise<ProductCategory | undefined> {
    const [updated] = await client
      .update(productCategories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(productCategories.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(productCategories)
      .where(eq(productCategories.id, id))
      .returning();

    return result.length > 0;
  }
}

export const categoriesRepository = new CategoriesRepository();
