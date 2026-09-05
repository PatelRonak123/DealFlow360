import { relations } from 'drizzle-orm';
import { users } from '../schema/users.js';
import { roles } from '../schema/roles.js';
import { permissions } from '../schema/permissions.js';
import { userRoles } from '../schema/userRoles.js';
import { rolePermissions } from '../schema/rolePermissions.js';
import { refreshTokens } from '../schema/refreshTokens.js';
import { customerTiers } from '../schema/customerTiers.js';
import { productCategories } from '../schema/productCategories.js';
import { products } from '../schema/products.js';
import { customers } from '../schema/customers.js';
import { priceLists } from '../schema/priceLists.js';
import { priceListItems } from '../schema/priceListItems.js';
import { customerTierDiscountRules } from '../schema/customerTierDiscountRules.js';
import { categoryDiscountRules } from '../schema/categoryDiscountRules.js';
import { quotations } from '../schema/quotations.js';
import { quotationItems } from '../schema/quotationItems.js';
import { quotationApprovals } from '../schema/quotationApprovals.js';
import { quotationDiscountEvaluations } from '../schema/quotationDiscountEvaluations.js';

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  refreshTokens: many(refreshTokens),
  quotations: many(quotations),
  decidedApprovals: many(quotationApprovals),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const customerTiersRelations = relations(customerTiers, ({ many, one }) => ({
  customers: many(customers),
  discountRule: one(customerTierDiscountRules),
}));

export const customerTierDiscountRulesRelations = relations(
  customerTierDiscountRules,
  ({ one }) => ({
    customerTier: one(customerTiers, {
      fields: [customerTierDiscountRules.customerTierId],
      references: [customerTiers.id],
    }),
  })
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  customerTier: one(customerTiers, {
    fields: [customers.customerTierId],
    references: [customerTiers.id],
  }),
  quotations: many(quotations),
}));

export const productCategoriesRelations = relations(productCategories, ({ many, one }) => ({
  products: many(products),
  discountRule: one(categoryDiscountRules),
}));

export const categoryDiscountRulesRelations = relations(
  categoryDiscountRules,
  ({ one }) => ({
    category: one(productCategories, {
      fields: [categoryDiscountRules.categoryId],
      references: [productCategories.id],
    }),
  })
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  priceListItems: many(priceListItems),
  quotationItems: many(quotationItems),
}));

export const priceListsRelations = relations(priceLists, ({ many }) => ({
  items: many(priceListItems),
  quotations: many(quotations),
}));

export const priceListItemsRelations = relations(priceListItems, ({ one }) => ({
  priceList: one(priceLists, {
    fields: [priceListItems.priceListId],
    references: [priceLists.id],
  }),
  product: one(products, {
    fields: [priceListItems.productId],
    references: [products.id],
  }),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotations.customerId],
    references: [customers.id],
  }),
  priceList: one(priceLists, {
    fields: [quotations.priceListId],
    references: [priceLists.id],
  }),
  createdByUser: one(users, {
    fields: [quotations.createdBy],
    references: [users.id],
  }),
  items: many(quotationItems),
  approvals: many(quotationApprovals),
  discountEvaluations: many(quotationDiscountEvaluations),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one, many }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  product: one(products, {
    fields: [quotationItems.productId],
    references: [products.id],
  }),
  discountEvaluations: many(quotationDiscountEvaluations),
}));

export const quotationApprovalsRelations = relations(quotationApprovals, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationApprovals.quotationId],
    references: [quotations.id],
  }),
  decidedByUser: one(users, {
    fields: [quotationApprovals.decidedById],
    references: [users.id],
  }),
}));

export const quotationDiscountEvaluationsRelations = relations(
  quotationDiscountEvaluations,
  ({ one }) => ({
    quotation: one(quotations, {
      fields: [quotationDiscountEvaluations.quotationId],
      references: [quotations.id],
    }),
    quotationItem: one(quotationItems, {
      fields: [quotationDiscountEvaluations.quotationItemId],
      references: [quotationItems.id],
    }),
  })
);
