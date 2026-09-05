export const Permissions = {
  // Users & RBAC
  USER_READ: 'user:read',
  USER_MANAGE: 'user:manage',

  // Customer Tiers
  CUSTOMER_TIER_READ: 'customer_tier:read',
  CUSTOMER_TIER_MANAGE: 'customer_tier:manage',

  // Product Categories
  CATEGORY_READ: 'category:read',
  CATEGORY_MANAGE: 'category:manage',

  // Products
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_MANAGE: 'product:manage',

  // Price Lists
  PRICE_LIST_READ: 'price_list:read',
  PRICE_LIST_MANAGE: 'price_list:manage',

  // Discount Rules
  DISCOUNT_RULE_READ: 'discount_rule:read',
  DISCOUNT_RULE_MANAGE: 'discount_rule:manage',

  // Customers
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_MANAGE: 'customer:manage',

  // Quotations
  QUOTATION_CREATE: 'quotation:create',
  QUOTATION_READ: 'quotation:read',
  QUOTATION_UPDATE: 'quotation:update',
  QUOTATION_APPROVE: 'quotation:approve',
  QUOTATION_DELETE: 'quotation:delete',
  QUOTATION_SEND: 'quotation:send',
  QUOTATION_SUBMIT: 'quotation:submit',
  QUOTATION_EVALUATE: 'quotation:evaluate',

  // Approvals & Governance
  APPROVAL_READ: 'approval:read',
  APPROVAL_APPROVE: 'approval:approve',
  APPROVAL_REJECT: 'approval:reject',

  // Discount Governance
  DISCOUNT_APPROVE: 'discount:approve',
  DISCOUNT_OVERRIDE: 'discount:override',

  // Recommendations & Upsell / Cross-Sell
  RECOMMENDATION_READ: 'recommendation:read',
  RECOMMENDATION_MANAGE: 'recommendation:manage',
  RECOMMENDATION_RULE_CREATE: 'recommendation_rule:create',
  RECOMMENDATION_RULE_READ: 'recommendation_rule:read',
  RECOMMENDATION_RULE_UPDATE: 'recommendation_rule:update',
  RECOMMENDATION_RULE_DELETE: 'recommendation_rule:delete',
  RECOMMENDATION_ACCEPT: 'recommendation:accept',
  RECOMMENDATION_DISMISS: 'recommendation:dismiss',

  // Billing & Payments
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',
  PAYMENT_PROCESS: 'payment:process',

  // Warehouses
  WAREHOUSE_READ: 'warehouse:read',
  WAREHOUSE_MANAGE: 'warehouse:manage',

  // Inventory & Fulfillment
  INVENTORY_READ: 'inventory:read',
  INVENTORY_MANAGE: 'inventory:manage',
  INVENTORY_ADJUST: 'inventory:adjust',
  FULFILLMENT_READ: 'fulfillment:read',
  FULFILLMENT_CREATE: 'fulfillment:create',
  FULFILLMENT_UPDATE: 'fulfillment:update',
  FULFILLMENT_CANCEL: 'fulfillment:cancel',
  FULFILLMENT_COMPLETE: 'fulfillment:complete',
  FULFILLMENT_MANAGE: 'fulfillment:manage',

  // Reports & Analytics
  REPORTS_VIEW: 'reports:view',
  AUDIT_VIEW: 'audit:view',
} as const;

export type PermissionName = (typeof Permissions)[keyof typeof Permissions];
