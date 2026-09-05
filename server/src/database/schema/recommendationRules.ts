import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { products } from './products.js';

export const recommendationRules = pgTable(
  'recommendation_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceProductId: uuid('source_product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    recommendedProductId: uuid('recommended_product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    recommendationType: varchar('recommendation_type', { length: 50 }).notNull(), // 'CROSS_SELL' | 'UPSELL'
    priority: varchar('priority', { length: 50 }).default('MEDIUM').notNull(), // 'LOW' | 'MEDIUM' | 'HIGH'
    defaultQuantity: integer('default_quantity').default(1).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('rec_rules_source_idx').on(table.sourceProductId),
    index('rec_rules_recommended_idx').on(table.recommendedProductId),
    index('rec_rules_is_active_idx').on(table.isActive),
  ]
);

export type RecommendationRule = typeof recommendationRules.$inferSelect;
export type NewRecommendationRule = typeof recommendationRules.$inferInsert;
