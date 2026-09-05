import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { fulfillments } from './fulfillments.js';
import { products } from './products.js';

export const backorders = pgTable(
  'backorders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fulfillmentId: uuid('fulfillment_id')
      .notNull()
      .references(() => fulfillments.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    requiredQuantity: integer('required_quantity').notNull(),
    allocatedQuantity: integer('allocated_quantity').notNull(),
    backorderedQuantity: integer('backordered_quantity').notNull(),
    status: varchar('status', { length: 50 }).default('OPEN').notNull(), // 'OPEN' | 'RESOLVED' | 'CANCELLED'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_backorders_fulfillment_id').on(table.fulfillmentId),
    index('idx_backorders_product_id').on(table.productId),
    index('idx_backorders_status').on(table.status),
  ]
);

export type Backorder = typeof backorders.$inferSelect;
export type NewBackorder = typeof backorders.$inferInsert;
