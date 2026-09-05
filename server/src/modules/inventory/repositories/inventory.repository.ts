import { eq, and, desc, sql } from 'drizzle-orm';
import { db as defaultDb, DbClient } from '../../../database/db.js';
import {
  warehouseInventory,
  WarehouseInventory,
  NewWarehouseInventory,
} from '../../../database/schema/warehouseInventory.js';
import {
  inventoryTransactions,
  InventoryTransaction,
  NewInventoryTransaction,
} from '../../../database/schema/inventoryTransactions.js';
import { warehouses } from '../../../database/schema/warehouses.js';
import { products } from '../../../database/schema/products.js';
import { ListInventoryQuery } from '../types/index.js';

export class InventoryRepository {
  async findByWarehouseAndProduct(
    warehouseId: string,
    productId: string,
    tx?: DbClient
  ): Promise<WarehouseInventory | null> {
    const client = tx || defaultDb;
    const records = await client
      .select()
      .from(warehouseInventory)
      .where(
        and(
          eq(warehouseInventory.warehouseId, warehouseId),
          eq(warehouseInventory.productId, productId)
        )
      )
      .limit(1);

    return records[0] || null;
  }

  async findById(id: string, tx?: DbClient): Promise<WarehouseInventory | null> {
    const client = tx || defaultDb;
    const records = await client
      .select()
      .from(warehouseInventory)
      .where(eq(warehouseInventory.id, id))
      .limit(1);

    return records[0] || null;
  }

  async upsert(
    data: NewWarehouseInventory,
    tx?: DbClient
  ): Promise<WarehouseInventory> {
    const client = tx || defaultDb;
    const [record] = await client
      .insert(warehouseInventory)
      .values(data)
      .onConflictDoUpdate({
        target: [warehouseInventory.warehouseId, warehouseInventory.productId],
        set: {
          quantityOnHand: data.quantityOnHand,
          reorderLevel: data.reorderLevel !== undefined ? data.reorderLevel : sql`${warehouseInventory.reorderLevel}`,
          updatedAt: new Date(),
        },
      })
      .returning();

    return record;
  }

  async updateStock(
    id: string,
    updates: {
      quantityOnHand?: number;
      reservedQuantity?: number;
      reorderLevel?: number;
    },
    tx?: DbClient
  ): Promise<WarehouseInventory> {
    const client = tx || defaultDb;
    const [record] = await client
      .update(warehouseInventory)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(warehouseInventory.id, id))
      .returning();

    return record;
  }

  async findByProductId(productId: string, tx?: DbClient) {
    const client = tx || defaultDb;
    return client
      .select({
        inventory: warehouseInventory,
        warehouse: warehouses,
      })
      .from(warehouseInventory)
      .innerJoin(warehouses, eq(warehouseInventory.warehouseId, warehouses.id))
      .where(
        and(
          eq(warehouseInventory.productId, productId),
          eq(warehouses.isActive, true)
        )
      )
      .orderBy(
        desc(sql`${warehouseInventory.quantityOnHand} - ${warehouseInventory.reservedQuantity}`),
        desc(warehouses.priority),
        warehouses.code
      );
  }

  async list(query: ListInventoryQuery, tx?: DbClient) {
    const client = tx || defaultDb;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.warehouseId) {
      conditions.push(eq(warehouseInventory.warehouseId, query.warehouseId));
    }

    if (query.productId) {
      conditions.push(eq(warehouseInventory.productId, query.productId));
    }

    if (query.search) {
      conditions.push(
        sql`(${products.name} ILIKE ${`%${query.search}%`} OR ${products.sku} ILIKE ${`%${query.search}%`} OR ${warehouses.name} ILIKE ${`%${query.search}%`})`
      );
    }

    if (query.lowStock) {
      conditions.push(sql`${warehouseInventory.quantityOnHand} <= ${warehouseInventory.reorderLevel}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await client
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(warehouseInventory)
      .innerJoin(warehouses, eq(warehouseInventory.warehouseId, warehouses.id))
      .innerJoin(products, eq(warehouseInventory.productId, products.id))
      .where(whereClause);

    const data = await client
      .select({
        id: warehouseInventory.id,
        warehouseId: warehouseInventory.warehouseId,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        productId: warehouseInventory.productId,
        productName: products.name,
        productSku: products.sku,
        quantityOnHand: warehouseInventory.quantityOnHand,
        reservedQuantity: warehouseInventory.reservedQuantity,
        availableQuantity: sql<number>`${warehouseInventory.quantityOnHand} - ${warehouseInventory.reservedQuantity}`,
        reorderLevel: warehouseInventory.reorderLevel,
        createdAt: warehouseInventory.createdAt,
        updatedAt: warehouseInventory.updatedAt,
      })
      .from(warehouseInventory)
      .innerJoin(warehouses, eq(warehouseInventory.warehouseId, warehouses.id))
      .innerJoin(products, eq(warehouseInventory.productId, products.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(products.name, warehouses.name);

    return {
      data,
      total: countResult.count,
      page,
      limit,
      totalPages: Math.ceil(countResult.count / limit),
    };
  }

  async createTransaction(
    data: NewInventoryTransaction,
    tx?: DbClient
  ): Promise<InventoryTransaction> {
    const client = tx || defaultDb;
    const [record] = await client
      .insert(inventoryTransactions)
      .values(data)
      .returning();

    return record;
  }

  async listTransactions(
    filters: {
      warehouseId?: string;
      productId?: string;
      transactionType?: string;
      page?: number;
      limit?: number;
    },
    tx?: DbClient
  ) {
    const client = tx || defaultDb;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.warehouseId) {
      conditions.push(eq(inventoryTransactions.warehouseId, filters.warehouseId));
    }
    if (filters.productId) {
      conditions.push(eq(inventoryTransactions.productId, filters.productId));
    }
    if (filters.transactionType) {
      conditions.push(eq(inventoryTransactions.transactionType, filters.transactionType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await client
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(inventoryTransactions)
      .where(whereClause);

    const data = await client
      .select({
        id: inventoryTransactions.id,
        inventoryId: inventoryTransactions.inventoryId,
        warehouseId: inventoryTransactions.warehouseId,
        warehouseName: warehouses.name,
        productId: inventoryTransactions.productId,
        productName: products.name,
        productSku: products.sku,
        transactionType: inventoryTransactions.transactionType,
        quantity: inventoryTransactions.quantity,
        quantityOnHandAfter: inventoryTransactions.quantityOnHandAfter,
        reservedQuantityAfter: inventoryTransactions.reservedQuantityAfter,
        referenceType: inventoryTransactions.referenceType,
        referenceId: inventoryTransactions.referenceId,
        notes: inventoryTransactions.notes,
        createdById: inventoryTransactions.createdById,
        createdAt: inventoryTransactions.createdAt,
      })
      .from(inventoryTransactions)
      .innerJoin(warehouses, eq(inventoryTransactions.warehouseId, warehouses.id))
      .innerJoin(products, eq(inventoryTransactions.productId, products.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(inventoryTransactions.createdAt));

    return {
      data,
      total: countResult.count,
      page,
      limit,
      totalPages: Math.ceil(countResult.count / limit),
    };
  }
}
