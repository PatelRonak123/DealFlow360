import { pgTable, uuid, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { warehouses } from './warehouses.js';
import { products } from './products.js';

export const warehouseInventory = pgTable(
  'warehouse_inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantityOnHand: integer('quantity_on_hand').default(0).notNull(),
    reservedQuantity: integer('reserved_quantity').default(0).notNull(),
    reorderLevel: integer('reorder_level').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_wh_inv_unique_wh_product').on(table.warehouseId, table.productId),
    index('idx_wh_inv_warehouse_id').on(table.warehouseId),
    index('idx_wh_inv_product_id').on(table.productId),
  ]
);

export type WarehouseInventory = typeof warehouseInventory.$inferSelect;
export type NewWarehouseInventory = typeof warehouseInventory.$inferInsert;
