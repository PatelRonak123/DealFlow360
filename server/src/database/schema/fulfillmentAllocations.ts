import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { fulfillments } from './fulfillments.js';
import { warehouses } from './warehouses.js';
import { products } from './products.js';

export const fulfillmentAllocations = pgTable(
  'fulfillment_allocations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fulfillmentId: uuid('fulfillment_id')
      .notNull()
      .references(() => fulfillments.id, { onDelete: 'cascade' }),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    allocatedQuantity: integer('allocated_quantity').notNull(),
    fulfilledQuantity: integer('fulfilled_quantity').default(0).notNull(),
    status: varchar('status', { length: 50 }).default('ALLOCATED').notNull(), // 'ALLOCATED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_ful_alloc_fulfillment_id').on(table.fulfillmentId),
    index('idx_ful_alloc_warehouse_id').on(table.warehouseId),
    index('idx_ful_alloc_product_id').on(table.productId),
    index('idx_ful_alloc_status').on(table.status),
  ]
);

export type FulfillmentAllocation = typeof fulfillmentAllocations.$inferSelect;
export type NewFulfillmentAllocation = typeof fulfillmentAllocations.$inferInsert;
