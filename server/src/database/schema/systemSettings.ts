import { pgTable, uuid, varchar, text, numeric, timestamp } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: varchar('company_name', { length: 255 }).default('DealFlow360 Technologies Pvt Ltd').notNull(),
  supportEmail: varchar('support_email', { length: 255 }).default('admin@dealflow360.com').notNull(),
  supportPhone: varchar('support_phone', { length: 50 }).default('+91 98765 43210'),
  defaultCurrency: varchar('default_currency', { length: 10 }).default('INR').notNull(),
  defaultTaxRate: numeric('default_tax_rate', { precision: 5, scale: 2 }).default('18.00').notNull(),
  quoteExpirationDays: varchar('quote_expiration_days', { length: 10 }).default('30').notNull(),
  approvalThresholdPercent: numeric('approval_threshold_percent', { precision: 5, scale: 2 }).default('10.00').notNull(),
  companyAddress: text('company_address').default('Level 7, Cyber Tower, Hi-Tech City, Hyderabad, India'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
