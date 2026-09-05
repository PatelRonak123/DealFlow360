import { db, Database } from '../../../database/db.js';
import {
  products,
  productCategories,
  Product,
  NewProduct,
  ProductCategory,
} from '../../../database/schema/index.js';
import { eq, ilike, and, or, sql, desc, count } from 'drizzle-orm';
import { ProductQueryInput } from '../validators/product.validator.js';

export interface ProductWithCategory extends Product {
  category?: ProductCategory;
}

export interface PaginatedProducts {
  items: ProductWithCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductsRepository {
  async findAll(
    query: ProductQueryInput,
    client: Database = db
  ): Promise<PaginatedProducts> {
    const { page = 1, limit = 20, search, categoryId, productType, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        )
      );
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (productType) {
      conditions.push(eq(products.productType, productType));
    }

    if (isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await client
      .select({ count: count() })
      .from(products)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const rows = await client
      .select({
        product: products,
        category: productCategories,
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const items: ProductWithCategory[] = rows.map((r) => ({
      ...r.product,
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

  async findById(id: string, client: Database = db): Promise<ProductWithCategory | undefined> {
    const row = await client.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
      },
    });

    return row as ProductWithCategory | undefined;
  }

  async findBySku(sku: string, client: Database = db): Promise<Product | undefined> {
    const normalized = sku.trim();
    return client.query.products.findFirst({
      where: sql`lower(${products.sku}) = lower(${normalized})`,
    });
  }

  async create(data: NewProduct, client: Database = db): Promise<Product> {
    const [created] = await client.insert(products).values(data).returning();
    return created;
  }

  async update(
    id: string,
    data: Partial<NewProduct>,
    client: Database = db
  ): Promise<Product | undefined> {
    const [updated] = await client
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, client: Database = db): Promise<boolean> {
    const result = await client
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    return result.length > 0;
  }
}

export const productsRepository = new ProductsRepository();
