import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const priceLists = pgTable('price_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  currency: varchar('currency', { length: 10 }).default('INR').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PriceList = typeof priceLists.$inferSelect;
export type NewPriceList = typeof priceLists.$inferInsert;
