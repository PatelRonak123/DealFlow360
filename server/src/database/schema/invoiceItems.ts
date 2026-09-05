import { pgTable, uuid, varchar, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { invoices } from './invoices.js';
import { products } from './products.js';

export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    productNameSnapshot: varchar('product_name_snapshot', { length: 255 }).notNull(),
    skuSnapshot: varchar('sku_snapshot', { length: 100 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0.00').notNull(),
    grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_invoice_items_invoice_id').on(table.invoiceId),
    index('idx_invoice_items_product_id').on(table.productId),
  ]
);

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
