import { pgTable, uuid, varchar, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { invoices } from './invoices.js';
import { customers } from './customers.js';
import { users } from './users.js';

export const creditNotes = pgTable(
  'credit_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creditNoteNumber: varchar('credit_note_number', { length: 50 }).notNull().unique(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('INR').notNull(),
    reason: text('reason').notNull(),
    status: varchar('status', { length: 50 }).default('APPROVED').notNull(), // 'DRAFT' | 'APPROVED' | 'APPLIED' | 'VOID'
    approvedById: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_credit_notes_invoice_id').on(table.invoiceId),
    index('idx_credit_notes_customer_id').on(table.customerId),
    index('idx_credit_notes_status').on(table.status),
  ]
);

export type CreditNote = typeof creditNotes.$inferSelect;
export type NewCreditNote = typeof creditNotes.$inferInsert;
