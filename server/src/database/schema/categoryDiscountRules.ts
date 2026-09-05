import { pgTable, uuid, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { productCategories } from './productCategories.js';

export const categoryDiscountRules = pgTable('category_discount_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id')
    .notNull()
    .unique()
    .references(() => productCategories.id, { onDelete: 'cascade' }),
  maxDiscountPercent: numeric('max_discount_percent', { precision: 5, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CategoryDiscountRule = typeof categoryDiscountRules.$inferSelect;
export type NewCategoryDiscountRule = typeof categoryDiscountRules.$inferInsert;
