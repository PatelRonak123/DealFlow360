import { pgTable, uuid, numeric, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { quotations } from './quotations.js';
import { quotationItems } from './quotationItems.js';

export const quotationDiscountEvaluations = pgTable(
  'quotation_discount_evaluations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quotationId: uuid('quotation_id')
      .notNull()
      .references(() => quotations.id, { onDelete: 'cascade' }),
    quotationItemId: uuid('quotation_item_id')
      .notNull()
      .references(() => quotationItems.id, { onDelete: 'cascade' }),
    appliedDiscount: numeric('applied_discount', { precision: 5, scale: 2 }).notNull(),
    customerTierLimit: numeric('customer_tier_limit', { precision: 5, scale: 2 }).notNull(),
    categoryLimit: numeric('category_limit', { precision: 5, scale: 2 }).notNull(),
    effectiveAllowedDiscount: numeric('effective_allowed_discount', { precision: 5, scale: 2 }).notNull(),
    excessDiscount: numeric('excess_discount', { precision: 5, scale: 2 }).notNull(),
    isViolation: boolean('is_violation').default(false).notNull(),
    riskContribution: numeric('risk_contribution', { precision: 12, scale: 2 }).default('0.00').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_qde_quotation_id').on(table.quotationId),
    index('idx_qde_quotation_item_id').on(table.quotationItemId),
  ]
);

export type QuotationDiscountEvaluation = typeof quotationDiscountEvaluations.$inferSelect;
export type NewQuotationDiscountEvaluation = typeof quotationDiscountEvaluations.$inferInsert;
