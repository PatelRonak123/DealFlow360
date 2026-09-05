import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { warehouseInventory } from './warehouseInventory.js';
import { warehouses } from './warehouses.js';
import { products } from './products.js';
import { users } from './users.js';

export const inventoryTransactions = pgTable(
  'inventory_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    inventoryId: uuid('inventory_id').references(() => warehouseInventory.id, {
      onDelete: 'set null',
    }),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // 'STOCK_RECEIVED' | 'STOCK_ADJUSTED' | 'RESERVED' | 'RESERVATION_RELEASED' | 'FULFILLED'
    quantity: integer('quantity').notNull(), // delta or quantity involved
    quantityOnHandAfter: integer('quantity_on_hand_after'),
    reservedQuantityAfter: integer('reserved_quantity_after'),
    referenceType: varchar('reference_type', { length: 50 }), // 'FULFILLMENT' | 'MANUAL' | 'INITIAL'
    referenceId: uuid('reference_id'),
    notes: text('notes'),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_inv_tx_warehouse_id').on(table.warehouseId),
    index('idx_inv_tx_product_id').on(table.productId),
    index('idx_inv_tx_type').on(table.transactionType),
    index('idx_inv_tx_created_at').on(table.createdAt),
  ]
);

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;
