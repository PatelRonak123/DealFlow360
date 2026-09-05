import { and, eq, ilike, or, count, desc, asc } from 'drizzle-orm';
import { db, Database, DbClient } from '../../../database/db.js';
import {
  warehouses,
  Warehouse,
  NewWarehouse,
} from '../../../database/schema/warehouses.js';
import { ListWarehousesQuery } from '../types/index.js';

export class WarehousesRepository {
  constructor(private readonly defaultDb: Database = db) {}

  private getClient(client?: DbClient): DbClient {
    return client || this.defaultDb;
  }

  async create(data: NewWarehouse, client?: DbClient): Promise<Warehouse> {
    const trx = this.getClient(client);
    const [created] = await trx.insert(warehouses).values(data).returning();
    return created;
  }

  async findById(id: string, client?: DbClient): Promise<Warehouse | null> {
    const trx = this.getClient(client);
    const [found] = await trx
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id));
    return found || null;
  }

  async findByCode(code: string, client?: DbClient): Promise<Warehouse | null> {
    const trx = this.getClient(client);
    const [found] = await trx
      .select()
      .from(warehouses)
      .where(eq(warehouses.code, code));
    return found || null;
  }

  async findByName(name: string, client?: DbClient): Promise<Warehouse | null> {
    const trx = this.getClient(client);
    const [found] = await trx
      .select()
      .from(warehouses)
      .where(eq(warehouses.name, name));
    return found || null;
  }

  async update(
    id: string,
    data: Partial<NewWarehouse>,
    client?: DbClient
  ): Promise<Warehouse | null> {
    const trx = this.getClient(client);
    const [updated] = await trx
      .update(warehouses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: string, client?: DbClient): Promise<boolean> {
    const trx = this.getClient(client);
    const deleted = await trx
      .delete(warehouses)
      .where(eq(warehouses.id, id))
      .returning();
    return deleted.length > 0;
  }

  async list(query: ListWarehousesQuery, client?: DbClient) {
    const trx = this.getClient(client);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.search) {
      conditions.push(
        or(
          ilike(warehouses.name, `%${query.search}%`),
          ilike(warehouses.code, `%${query.search}%`),
          ilike(warehouses.city, `%${query.search}%`)
        )
      );
    }
    if (query.city) {
      conditions.push(ilike(warehouses.city, `%${query.city}%`));
    }
    if (query.state) {
      conditions.push(ilike(warehouses.state, `%${query.state}%`));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(warehouses.isActive, query.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await trx
      .select({ count: count() })
      .from(warehouses)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const items = await trx
      .select()
      .from(warehouses)
      .where(whereClause)
      .orderBy(desc(warehouses.priority), asc(warehouses.name))
      .limit(limit)
      .offset(offset);

    return {
      warehouses: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllActive(client?: DbClient): Promise<Warehouse[]> {
    const trx = this.getClient(client);
    return await trx
      .select()
      .from(warehouses)
      .where(eq(warehouses.isActive, true))
      .orderBy(desc(warehouses.priority), asc(warehouses.code));
  }
}

export const warehousesRepository = new WarehousesRepository();
