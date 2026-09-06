import { pgTable, uuid, varchar, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { quotations } from './quotations.js';
import { customers } from './customers.js';
import { users } from './users.js';

export const quotationNegotiations = pgTable(
  'quotation_negotiations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quotationId: uuid('quotation_id')
      .notNull()
      .references(() => quotations.id, { onDelete: 'cascade' }),
    quotationVersionId: uuid('quotation_version_id').references((): any => quotations.id, {
      onDelete: 'set null',
    }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    requestedDiscountPercent: numeric('requested_discount_percent', { precision: 5, scale: 2 }).notNull(),
    requestedChanges: text('requested_changes'),
    customerMessage: text('customer_message'),
    status: varchar('status', { length: 50 }).default('REQUESTED').notNull(), // 'REQUESTED' | 'UNDER_REVIEW' | 'DECLINED' | 'REVISION_CREATED' | 'APPROVED'
    repResponse: text('rep_response'),
    revisedQuotationId: uuid('revised_quotation_id').references((): any => quotations.id, {
      onDelete: 'set null',
    }),
    handledBy: uuid('handled_by').references(() => users.id, { onDelete: 'set null' }),
    handledAt: timestamp('handled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_quotation_negotiations_quotation_id').on(table.quotationId),
    index('idx_quotation_negotiations_customer_id').on(table.customerId),
    index('idx_quotation_negotiations_status').on(table.status),
  ]
);

export type QuotationNegotiation = typeof quotationNegotiations.$inferSelect;
export type NewQuotationNegotiation = typeof quotationNegotiations.$inferInsert;
