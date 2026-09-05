import { pgTable, uuid, varchar, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { invoices } from './invoices.js';
import { customers } from './customers.js';
import { users } from './users.js';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    paymentNumber: varchar('payment_number', { length: 50 }).notNull().unique(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('INR').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // 'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'UPI'
    transactionReference: varchar('transaction_reference', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).default('COMPLETED').notNull(), // 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
    notes: text('notes'),
    recordedById: uuid('recorded_by_id').references(() => users.id, { onDelete: 'set null' }),
    paidAt: timestamp('paid_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_payments_invoice_id').on(table.invoiceId),
    index('idx_payments_customer_id').on(table.customerId),
    index('idx_payments_status').on(table.status),
    index('idx_payments_paid_at').on(table.paidAt),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
