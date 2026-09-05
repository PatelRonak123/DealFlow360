import { pgTable, uuid, varchar, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { quotations } from './quotations.js';
import { products } from './products.js';
import { recommendationRules } from './recommendationRules.js';
import { users } from './users.js';

export const recommendationEvents = pgTable(
  'recommendation_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quotationId: uuid('quotation_id')
      .notNull()
      .references(() => quotations.id, { onDelete: 'cascade' }),
    recommendationRuleId: uuid('recommendation_rule_id').references(() => recommendationRules.id, {
      onDelete: 'set null',
    }),
    recommendedProductId: uuid('recommended_product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 50 }).notNull(), // 'GENERATED' | 'ACCEPTED' | 'DISMISSED'
    quantity: integer('quantity').default(1),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }),
    additionalRevenue: numeric('additional_revenue', { precision: 12, scale: 2 }),
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('rec_events_quotation_idx').on(table.quotationId),
    index('rec_events_rule_idx').on(table.recommendationRuleId),
    index('rec_events_product_idx').on(table.recommendedProductId),
    index('rec_events_type_idx').on(table.eventType),
  ]
);

export type RecommendationEvent = typeof recommendationEvents.$inferSelect;
export type NewRecommendationEvent = typeof recommendationEvents.$inferInsert;
