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

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  refreshTokens: many(refreshTokens),
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

export const customerTiersRelations = relations(customerTiers, ({ many }) => ({
  customers: many(customers),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  customerTier: one(customerTiers, {
    fields: [customers.customerTierId],
    references: [customerTiers.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
}));
