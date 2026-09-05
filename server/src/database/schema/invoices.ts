import { pgTable, uuid, varchar, text, numeric, date, timestamp, index } from 'drizzle-orm/pg-core';
import { quotations } from './quotations.js';
import { customers } from './customers.js';
import { users } from './users.js';

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
    quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    orderNumber: varchar('order_number', { length: 50 }),
    status: varchar('status', { length: 50 }).default('ISSUED').notNull(), // 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    currency: varchar('currency', { length: 10 }).default('INR').notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0.00').notNull(),
    discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
    amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0.00').notNull(),
    balanceDue: numeric('balance_due', { precision: 12, scale: 2 }).default('0.00').notNull(),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date').notNull(),
    notes: text('notes'),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_invoices_customer_id').on(table.customerId),
    index('idx_invoices_quotation_id').on(table.quotationId),
    index('idx_invoices_status').on(table.status),
    index('idx_invoices_issue_date').on(table.issueDate),
    index('idx_invoices_due_date').on(table.dueDate),
  ]
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
