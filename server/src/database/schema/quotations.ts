import { pgTable, uuid, varchar, text, numeric, date, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { customers } from './customers.js';
import { priceLists } from './priceLists.js';
import { users } from './users.js';

export const quotations = pgTable('quotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotationNumber: varchar('quotation_number', { length: 50 }).notNull().unique(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  priceListId: uuid('price_list_id')
    .notNull()
    .references(() => priceLists.id),
  status: varchar('status', { length: 50 }).default('DRAFT').notNull(),
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0.00').notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  issueDate: date('issue_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  notes: text('notes'),
  parentQuotationId: uuid('parent_quotation_id').references((): any => quotations.id, {
    onDelete: 'set null',
  }),
  versionNumber: integer('version_number').default(1).notNull(),
  isCustomerVisible: boolean('is_customer_visible').default(false).notNull(),
  revisionReason: text('revision_reason'),
  negotiationId: uuid('negotiation_id'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;
