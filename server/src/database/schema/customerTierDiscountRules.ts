import { pgTable, uuid, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { customerTiers } from './customerTiers.js';

export const customerTierDiscountRules = pgTable('customer_tier_discount_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerTierId: uuid('customer_tier_id')
    .notNull()
    .unique()
    .references(() => customerTiers.id, { onDelete: 'cascade' }),
  maxDiscountPercent: numeric('max_discount_percent', { precision: 5, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CustomerTierDiscountRule = typeof customerTierDiscountRules.$inferSelect;
export type NewCustomerTierDiscountRule = typeof customerTierDiscountRules.$inferInsert;
