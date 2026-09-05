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
import { recommendationRules } from '../schema/recommendationRules.js';
import { recommendationEvents } from '../schema/recommendationEvents.js';
import { warehouses } from '../schema/warehouses.js';
import { warehouseInventory } from '../schema/warehouseInventory.js';
import { inventoryTransactions } from '../schema/inventoryTransactions.js';
import { fulfillments } from '../schema/fulfillments.js';
import { fulfillmentAllocations } from '../schema/fulfillmentAllocations.js';
import { backorders } from '../schema/backorders.js';

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  refreshTokens: many(refreshTokens),
  quotations: many(quotations),
  decidedApprovals: many(quotationApprovals),
  recommendationEvents: many(recommendationEvents),
  fulfillments: many(fulfillments),
  inventoryTransactions: many(inventoryTransactions),
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
  sourceRules: many(recommendationRules, { relationName: 'sourceProduct' }),
  recommendedRules: many(recommendationRules, { relationName: 'recommendedProduct' }),
  recommendationEvents: many(recommendationEvents),
  warehouseInventory: many(warehouseInventory),
  inventoryTransactions: many(inventoryTransactions),
  fulfillmentAllocations: many(fulfillmentAllocations),
  backorders: many(backorders),
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
  recommendationEvents: many(recommendationEvents),
  fulfillments: many(fulfillments),
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

export const recommendationRulesRelations = relations(recommendationRules, ({ one, many }) => ({
  sourceProduct: one(products, {
    fields: [recommendationRules.sourceProductId],
    references: [products.id],
    relationName: 'sourceProduct',
  }),
  recommendedProduct: one(products, {
    fields: [recommendationRules.recommendedProductId],
    references: [products.id],
    relationName: 'recommendedProduct',
  }),
  events: many(recommendationEvents),
}));

export const recommendationEventsRelations = relations(recommendationEvents, ({ one }) => ({
  quotation: one(quotations, {
    fields: [recommendationEvents.quotationId],
    references: [quotations.id],
  }),
  recommendationRule: one(recommendationRules, {
    fields: [recommendationEvents.recommendationRuleId],
    references: [recommendationRules.id],
  }),
  recommendedProduct: one(products, {
    fields: [recommendationEvents.recommendedProductId],
    references: [products.id],
  }),
  createdByUser: one(users, {
    fields: [recommendationEvents.createdById],
    references: [users.id],
  }),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  inventory: many(warehouseInventory),
  transactions: many(inventoryTransactions),
  fulfillmentAllocations: many(fulfillmentAllocations),
}));

export const warehouseInventoryRelations = relations(warehouseInventory, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseInventory.warehouseId],
    references: [warehouses.id],
  }),
  product: one(products, {
    fields: [warehouseInventory.productId],
    references: [products.id],
  }),
  transactions: many(inventoryTransactions),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  inventory: one(warehouseInventory, {
    fields: [inventoryTransactions.inventoryId],
    references: [warehouseInventory.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryTransactions.warehouseId],
    references: [warehouses.id],
  }),
  product: one(products, {
    fields: [inventoryTransactions.productId],
    references: [products.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryTransactions.createdById],
    references: [users.id],
  }),
}));

export const fulfillmentsRelations = relations(fulfillments, ({ one, many }) => ({
  quotation: one(quotations, {
    fields: [fulfillments.quotationId],
    references: [quotations.id],
  }),
  createdByUser: one(users, {
    fields: [fulfillments.createdById],
    references: [users.id],
  }),
  allocations: many(fulfillmentAllocations),
  backorders: many(backorders),
}));

export const fulfillmentAllocationsRelations = relations(fulfillmentAllocations, ({ one }) => ({
  fulfillment: one(fulfillments, {
    fields: [fulfillmentAllocations.fulfillmentId],
    references: [fulfillments.id],
  }),
  warehouse: one(warehouses, {
    fields: [fulfillmentAllocations.warehouseId],
    references: [warehouses.id],
  }),
  product: one(products, {
    fields: [fulfillmentAllocations.productId],
    references: [products.id],
  }),
}));

export const backordersRelations = relations(backorders, ({ one }) => ({
  fulfillment: one(fulfillments, {
    fields: [backorders.fulfillmentId],
    references: [fulfillments.id],
  }),
  product: one(products, {
    fields: [backorders.productId],
    references: [products.id],
  }),
}));
