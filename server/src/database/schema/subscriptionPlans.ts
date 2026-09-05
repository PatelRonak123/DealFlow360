import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const subscriptionPlans = pgTable(
  'subscription_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    description: text('description'),
    billingInterval: varchar('billing_interval', { length: 20 }).default('MONTHLY').notNull(), // MONTHLY, QUARTERLY, YEARLY
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('INR').notNull(),
    features: jsonb('features').default([]).notNull(), // Array of string features
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_subscription_plans_code').on(table.code),
    index('idx_subscription_plans_is_active').on(table.isActive),
  ]
);

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
