import { eq, and, desc, sql, ne } from 'drizzle-orm';
import { db as defaultDb, DbClient } from '../../../database/db.js';
import {
  fulfillments,
  Fulfillment,
  NewFulfillment,
} from '../../../database/schema/fulfillments.js';
import {
  fulfillmentAllocations,
  FulfillmentAllocation,
  NewFulfillmentAllocation,
} from '../../../database/schema/fulfillmentAllocations.js';
import {
  backorders,
  Backorder,
  NewBackorder,
} from '../../../database/schema/backorders.js';
import { quotations } from '../../../database/schema/quotations.js';
import { customers } from '../../../database/schema/customers.js';
import { warehouses } from '../../../database/schema/warehouses.js';
import { products } from '../../../database/schema/products.js';
import { users } from '../../../database/schema/users.js';
import { ListFulfillmentsQuery } from '../types/index.js';

export class FulfillmentRepository {
  async createFulfillment(
    data: NewFulfillment,
    tx?: DbClient
  ): Promise<Fulfillment> {
    const client = tx || defaultDb;
    const [record] = await client
      .insert(fulfillments)
      .values(data)
      .returning();

    return record;
  }

  async findById(id: string, tx?: DbClient) {
    const client = tx || defaultDb;
    const [record] = await client
      .select({
        fulfillment: fulfillments,
        quotation: quotations,
        customer: customers,
        createdByUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(fulfillments)
      .innerJoin(quotations, eq(fulfillments.quotationId, quotations.id))
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(users, eq(fulfillments.createdById, users.id))
      .where(eq(fulfillments.id, id));

    if (!record) return null;

    const allocationsList = await client
      .select({
        id: fulfillmentAllocations.id,
        fulfillmentId: fulfillmentAllocations.fulfillmentId,
        warehouseId: fulfillmentAllocations.warehouseId,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
        productId: fulfillmentAllocations.productId,
        productName: products.name,
        productSku: products.sku,
        allocatedQuantity: fulfillmentAllocations.allocatedQuantity,
        fulfilledQuantity: fulfillmentAllocations.fulfilledQuantity,
        status: fulfillmentAllocations.status,
        createdAt: fulfillmentAllocations.createdAt,
        updatedAt: fulfillmentAllocations.updatedAt,
      })
      .from(fulfillmentAllocations)
      .innerJoin(warehouses, eq(fulfillmentAllocations.warehouseId, warehouses.id))
      .innerJoin(products, eq(fulfillmentAllocations.productId, products.id))
      .where(eq(fulfillmentAllocations.fulfillmentId, id));

    const backordersList = await client
      .select({
        id: backorders.id,
        fulfillmentId: backorders.fulfillmentId,
        productId: backorders.productId,
        productName: products.name,
        productSku: products.sku,
        requiredQuantity: backorders.requiredQuantity,
        allocatedQuantity: backorders.allocatedQuantity,
        backorderedQuantity: backorders.backorderedQuantity,
        status: backorders.status,
        createdAt: backorders.createdAt,
        updatedAt: backorders.updatedAt,
      })
      .from(backorders)
      .innerJoin(products, eq(backorders.productId, products.id))
      .where(eq(backorders.fulfillmentId, id));

    return {
      ...record.fulfillment,
      quotationNumber: record.quotation.quotationNumber,
      quotationStatus: record.quotation.status,
      customerName: record.customer?.companyName || null,
      createdByName: record.createdByUser?.name || null,
      createdByEmail: record.createdByUser?.email || null,
      allocations: allocationsList,
      backorders: backordersList,
    };
  }

  async findByQuotationId(quotationId: string, tx?: DbClient) {
    const client = tx || defaultDb;
    const records = await client
      .select()
      .from(fulfillments)
      .where(eq(fulfillments.quotationId, quotationId))
      .orderBy(desc(fulfillments.createdAt));

    return records;
  }

  async findActiveByQuotationId(quotationId: string, tx?: DbClient) {
    const client = tx || defaultDb;
    const records = await client
      .select()
      .from(fulfillments)
      .where(
        and(
          eq(fulfillments.quotationId, quotationId),
          ne(fulfillments.status, 'CANCELLED')
        )
      )
      .limit(1);

    return records[0] || null;
  }

  async updateFulfillment(
    id: string,
    updates: Partial<NewFulfillment>,
    tx?: DbClient
  ): Promise<Fulfillment> {
    const client = tx || defaultDb;
    const [record] = await client
      .update(fulfillments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(fulfillments.id, id))
      .returning();

    return record;
  }

  async createAllocations(
    data: NewFulfillmentAllocation[],
    tx?: DbClient
  ): Promise<FulfillmentAllocation[]> {
    if (data.length === 0) return [];
    const client = tx || defaultDb;
    return client.insert(fulfillmentAllocations).values(data).returning();
  }

  async getAllocationsByFulfillmentId(
    fulfillmentId: string,
    tx?: DbClient
  ): Promise<FulfillmentAllocation[]> {
    const client = tx || defaultDb;
    return client
      .select()
      .from(fulfillmentAllocations)
      .where(eq(fulfillmentAllocations.fulfillmentId, fulfillmentId));
  }

  async updateAllocation(
    id: string,
    updates: Partial<NewFulfillmentAllocation>,
    tx?: DbClient
  ): Promise<FulfillmentAllocation> {
    const client = tx || defaultDb;
    const [record] = await client
      .update(fulfillmentAllocations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(fulfillmentAllocations.id, id))
      .returning();

    return record;
  }

  async deleteAllocationsByFulfillmentId(
    fulfillmentId: string,
    tx?: DbClient
  ): Promise<void> {
    const client = tx || defaultDb;
    await client
      .delete(fulfillmentAllocations)
      .where(eq(fulfillmentAllocations.fulfillmentId, fulfillmentId));
  }

  async createBackorders(
    data: NewBackorder[],
    tx?: DbClient
  ): Promise<Backorder[]> {
    if (data.length === 0) return [];
    const client = tx || defaultDb;
    return client.insert(backorders).values(data).returning();
  }

  async getBackordersByFulfillmentId(
    fulfillmentId: string,
    tx?: DbClient
  ): Promise<Backorder[]> {
    const client = tx || defaultDb;
    return client
      .select()
      .from(backorders)
      .where(eq(backorders.fulfillmentId, fulfillmentId));
  }

  async deleteBackordersByFulfillmentId(
    fulfillmentId: string,
    tx?: DbClient
  ): Promise<void> {
    const client = tx || defaultDb;
    await client
      .delete(backorders)
      .where(eq(backorders.fulfillmentId, fulfillmentId));
  }

  async list(query: ListFulfillmentsQuery, tx?: DbClient) {
    const client = tx || defaultDb;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.status) {
      conditions.push(eq(fulfillments.status, query.status));
    }

    if (query.quotationId) {
      conditions.push(eq(fulfillments.quotationId, query.quotationId));
    }

    if (query.search) {
      conditions.push(
        sql`(${fulfillments.fulfillmentNumber} ILIKE ${`%${query.search}%`} OR ${quotations.quotationNumber} ILIKE ${`%${query.search}%`} OR ${customers.companyName} ILIKE ${`%${query.search}%`})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await client
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(fulfillments)
      .innerJoin(quotations, eq(fulfillments.quotationId, quotations.id))
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .where(whereClause);

    const data = await client
      .select({
        id: fulfillments.id,
        fulfillmentNumber: fulfillments.fulfillmentNumber,
        quotationId: fulfillments.quotationId,
        quotationNumber: quotations.quotationNumber,
        customerName: customers.companyName,
        status: fulfillments.status,
        allocatedAt: fulfillments.allocatedAt,
        fulfilledAt: fulfillments.fulfilledAt,
        cancelledAt: fulfillments.cancelledAt,
        cancellationReason: fulfillments.cancellationReason,
        createdAt: fulfillments.createdAt,
        updatedAt: fulfillments.updatedAt,
      })
      .from(fulfillments)
      .innerJoin(quotations, eq(fulfillments.quotationId, quotations.id))
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(fulfillments.createdAt));

    return {
      data,
      total: countResult.count,
      page,
      limit,
      totalPages: Math.ceil(countResult.count / limit),
    };
  }
}
