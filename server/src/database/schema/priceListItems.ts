import { pgTable, uuid, numeric, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { priceLists } from './priceLists.js';
import { products } from './products.js';

export const priceListItems = pgTable(
  'price_list_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    priceListId: uuid('price_list_id')
      .notNull()
      .references(() => priceLists.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('price_list_items_price_list_id_product_id_idx').on(
      table.priceListId,
      table.productId
    ),
  ]
);

export type PriceListItem = typeof priceListItems.$inferSelect;
export type NewPriceListItem = typeof priceListItems.$inferInsert;
