export interface AdminDashboardMetrics {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  customers: {
    total: number;
    active: number;
  };
  products: {
    total: number;
    active: number;
  };
  warehouses: {
    total: number;
    active: number;
  };
  subscriptionPlans: {
    total: number;
    active: number;
  };
  quotations: {
    total: number;
    pendingApprovals: number;
    approved: number;
    sent: number;
  };
  orders: {
    total: number;
  };
  systemStatus: {
    status: string;
    version: string;
    uptimeSeconds: number;
    timestamp: string;
  };
}

export interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  isSystemRole: boolean;
  permissions: AdminPermission[];
  assignedUsersCount: number;
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface GroupedPermission {
  domain: string;
  items: AdminPermission[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: { id: string; name: string; description: string | null }[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  categoryId: string;
  productType: 'ONE_TIME' | 'RECURRING' | 'SERVICE';
  basePrice: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  price: string;
  createdAt: string;
  updatedAt: string;
  product?: AdminProduct;
}

export interface PriceList {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: PriceListItem[];
}

export interface CustomerTier {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TierDiscountRule {
  id: string;
  customerTierId: string;
  maxDiscountPercent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customerTier?: CustomerTier;
}

export interface CategoryDiscountRule {
  id: string;
  categoryId: string;
  maxDiscountPercent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  billingInterval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: string;
  currency: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  id: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string | null;
  defaultCurrency: string;
  defaultTaxRate: string;
  quoteExpirationDays: string;
  approvalThresholdPercent: string;
  companyAddress: string | null;
  updatedAt: string;
}
