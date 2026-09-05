import { pgTable, uuid, varchar, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { quotations } from './quotations.js';
import { products } from './products.js';

export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotationId: uuid('quotation_id')
    .notNull()
    .references(() => quotations.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  productNameSnapshot: varchar('product_name_snapshot', { length: 255 }).notNull(),
  skuSnapshot: varchar('sku_snapshot', { length: 100 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0.00').notNull(),
  grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull(),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type QuotationItem = typeof quotationItems.$inferSelect;
export type NewQuotationItem = typeof quotationItems.$inferInsert;
