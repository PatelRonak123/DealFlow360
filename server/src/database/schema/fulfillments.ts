import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { quotations } from './quotations.js';
import { users } from './users.js';

export const fulfillments = pgTable(
  'fulfillments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fulfillmentNumber: varchar('fulfillment_number', { length: 50 }).notNull().unique(),
    quotationId: uuid('quotation_id')
      .notNull()
      .references(() => quotations.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).default('PENDING').notNull(), // 'PENDING' | 'ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED'
    allocatedAt: timestamp('allocated_at', { withTimezone: true }),
    fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fulfillments_quotation_id').on(table.quotationId),
    index('idx_fulfillments_status').on(table.status),
    index('idx_fulfillments_number').on(table.fulfillmentNumber),
  ]
);

export type Fulfillment = typeof fulfillments.$inferSelect;
export type NewFulfillment = typeof fulfillments.$inferInsert;
