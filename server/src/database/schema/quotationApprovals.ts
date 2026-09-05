import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { quotations } from './quotations.js';
import { users } from './users.js';

export const quotationApprovals = pgTable(
  'quotation_approvals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quotationId: uuid('quotation_id')
      .notNull()
      .references(() => quotations.id, { onDelete: 'cascade' }),
    approvalLevel: varchar('approval_level', { length: 50 }).notNull(), // 'MANAGER' | 'FINANCE'
    status: varchar('status', { length: 50 }).default('PENDING').notNull(), // 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVALIDATED'
    sequence: integer('sequence').notNull(), // 1 for Manager, 2 for Finance
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decidedById: uuid('decided_by_id').references(() => users.id, { onDelete: 'set null' }),
    comments: text('comments'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_quotation_approvals_quotation_id').on(table.quotationId),
    index('idx_quotation_approvals_status').on(table.status),
    index('idx_quotation_approvals_level').on(table.approvalLevel),
  ]
);

export type QuotationApproval = typeof quotationApprovals.$inferSelect;
export type NewQuotationApproval = typeof quotationApprovals.$inferInsert;
