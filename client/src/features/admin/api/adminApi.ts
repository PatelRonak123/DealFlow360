import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import {
  AdminDashboardMetrics,
  AdminUser,
  AdminRole,
  AdminPermission,
  GroupedPermission,
  ProductCategory,
  AdminProduct,
  PriceList,
  PriceListItem,
  CustomerTier,
  TierDiscountRule,
  CategoryDiscountRule,
  Warehouse,
  SubscriptionPlan,
  SystemSettings,
} from '../types/admin.types';

export const adminApi = {
  // Module A: Dashboard Metrics
  getDashboardMetrics: async (): Promise<AdminDashboardMetrics> => {
    const res = await apiClient.get<ApiResponse<AdminDashboardMetrics>>('/admin/dashboard');
    return res.data.data!;
  },

  // Module B: User Management
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminUser[]; total: number }> => {
    const res = await apiClient.get<ApiResponse<AdminUser[]>>('/users', { params });
    return {
      items: res.data.data || [],
      total: res.data.meta?.total || (res.data.data ? res.data.data.length : 0),
    };
  },

  getUserById: async (id: string): Promise<AdminUser> => {
    const res = await apiClient.get<ApiResponse<AdminUser>>(`/users/${id}`);
    return res.data.data!;
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    roleIds: string[];
    isActive?: boolean;
  }): Promise<AdminUser> => {
    const res = await apiClient.post<ApiResponse<AdminUser>>('/users', data);
    return res.data.data!;
  },

  updateUser: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      roleIds?: string[];
      isActive?: boolean;
    }
  ): Promise<AdminUser> => {
    const res = await apiClient.patch<ApiResponse<AdminUser>>(`/users/${id}`, data);
    return res.data.data!;
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<AdminUser> => {
    const res = await apiClient.patch<ApiResponse<AdminUser>>(`/users/${id}/status`, { isActive });
    return res.data.data!;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Module C: Role Management
  getRoles: async (): Promise<AdminRole[]> => {
    const res = await apiClient.get<ApiResponse<AdminRole[]>>('/roles');
    return res.data.data || [];
  },

  getRoleById: async (id: string): Promise<AdminRole> => {
    const res = await apiClient.get<ApiResponse<AdminRole>>(`/roles/${id}`);
    return res.data.data!;
  },

  createRole: async (data: {
    name: string;
    description?: string | null;
    permissionIds: string[];
  }): Promise<AdminRole> => {
    const res = await apiClient.post<ApiResponse<AdminRole>>('/roles', data);
    return res.data.data!;
  },

  updateRole: async (
    id: string,
    data: {
      description?: string | null;
      permissionIds?: string[];
    }
  ): Promise<AdminRole> => {
    const res = await apiClient.patch<ApiResponse<AdminRole>>(`/roles/${id}`, data);
    return res.data.data!;
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },

  // Module D: Permissions
  getPermissions: async (): Promise<{ flat: AdminPermission[]; grouped: GroupedPermission[] }> => {
    const res = await apiClient.get<ApiResponse<{ flat: AdminPermission[]; grouped: GroupedPermission[] }>>(
      '/permissions'
    );
    return res.data.data!;
  },

  // Module E: Product Categories
  getCategories: async (): Promise<ProductCategory[]> => {
    const res = await apiClient.get<ApiResponse<ProductCategory[]>>('/categories', {
      params: { limit: 100 },
    });
    return res.data.data || [];
  },

  createCategory: async (data: { name: string; description?: string | null; isActive?: boolean }): Promise<ProductCategory> => {
    const res = await apiClient.post<ApiResponse<ProductCategory>>('/categories', data);
    return res.data.data!;
  },

  updateCategory: async (
    id: string,
    data: { name?: string; description?: string | null; isActive?: boolean }
  ): Promise<ProductCategory> => {
    const res = await apiClient.patch<ApiResponse<ProductCategory>>(`/categories/${id}`, data);
    return res.data.data!;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  // Module F: Products
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<{ items: AdminProduct[]; total: number }> => {
    const res = await apiClient.get<ApiResponse<AdminProduct[]>>('/products', { params });
    return {
      items: res.data.data || [],
      total: res.data.meta?.total || (res.data.data ? res.data.data.length : 0),
    };
  },

  createProduct: async (data: {
    name: string;
    sku: string;
    description?: string | null;
    categoryId: string;
    productType: 'ONE_TIME' | 'RECURRING' | 'SERVICE';
    basePrice: string;
    currency: string;
    isActive?: boolean;
  }): Promise<AdminProduct> => {
    const res = await apiClient.post<ApiResponse<AdminProduct>>('/products', data);
    return res.data.data!;
  },

  updateProduct: async (
    id: string,
    data: {
      name?: string;
      sku?: string;
      description?: string | null;
      categoryId?: string;
      productType?: 'ONE_TIME' | 'RECURRING' | 'SERVICE';
      basePrice?: string;
      currency?: string;
      isActive?: boolean;
    }
  ): Promise<AdminProduct> => {
    const res = await apiClient.patch<ApiResponse<AdminProduct>>(`/products/${id}`, data);
    return res.data.data!;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // Module G: Price Lists
  getPriceLists: async (): Promise<PriceList[]> => {
    const res = await apiClient.get<ApiResponse<PriceList[]>>('/price-lists', {
      params: { limit: 100 },
    });
    return res.data.data || [];
  },

  getPriceListById: async (id: string): Promise<PriceList> => {
    const res = await apiClient.get<ApiResponse<PriceList>>(`/price-lists/${id}`);
    return res.data.data!;
  },

  createPriceList: async (data: {
    name: string;
    currency: string;
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<PriceList> => {
    const res = await apiClient.post<ApiResponse<PriceList>>('/price-lists', data);
    return res.data.data!;
  },

  updatePriceList: async (
    id: string,
    data: {
      name?: string;
      currency?: string;
      isDefault?: boolean;
      isActive?: boolean;
    }
  ): Promise<PriceList> => {
    const res = await apiClient.patch<ApiResponse<PriceList>>(`/price-lists/${id}`, data);
    return res.data.data!;
  },

  deletePriceList: async (id: string): Promise<void> => {
    await apiClient.delete(`/price-lists/${id}`);
  },

  getPriceListItems: async (priceListId: string): Promise<PriceListItem[]> => {
    const res = await apiClient.get<ApiResponse<PriceListItem[]>>(`/price-lists/${priceListId}/items`);
    return res.data.data || [];
  },

  addPriceListItem: async (
    priceListId: string,
    data: { productId: string; price: string }
  ): Promise<PriceListItem> => {
    const res = await apiClient.post<ApiResponse<PriceListItem>>(`/price-lists/${priceListId}/items`, data);
    return res.data.data!;
  },

  updatePriceListItem: async (
    priceListId: string,
    itemId: string,
    data: { price: string }
  ): Promise<PriceListItem> => {
    const res = await apiClient.patch<ApiResponse<PriceListItem>>(
      `/price-lists/${priceListId}/items/${itemId}`,
      data
    );
    return res.data.data!;
  },

  deletePriceListItem: async (priceListId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/price-lists/${priceListId}/items/${itemId}`);
  },

  // Module H: Customer Tiers
  getCustomerTiers: async (): Promise<CustomerTier[]> => {
    const res = await apiClient.get<ApiResponse<CustomerTier[]>>('/customer-tiers', {
      params: { limit: 100 },
    });
    return res.data.data || [];
  },

  createCustomerTier: async (data: {
    name: string;
    description?: string | null;
    isActive?: boolean;
  }): Promise<CustomerTier> => {
    const res = await apiClient.post<ApiResponse<CustomerTier>>('/customer-tiers', data);
    return res.data.data!;
  },

  updateCustomerTier: async (
    id: string,
    data: { name?: string; description?: string | null; isActive?: boolean }
  ): Promise<CustomerTier> => {
    const res = await apiClient.patch<ApiResponse<CustomerTier>>(`/customer-tiers/${id}`, data);
    return res.data.data!;
  },

  deleteCustomerTier: async (id: string): Promise<void> => {
    await apiClient.delete(`/customer-tiers/${id}`);
  },

  // Module I: Discount Rules
  getTierDiscountRules: async (): Promise<TierDiscountRule[]> => {
    const res = await apiClient.get<ApiResponse<TierDiscountRule[]>>('/discount-rules/customer-tiers');
    return res.data.data || [];
  },

  createTierDiscountRule: async (data: {
    customerTierId: string;
    maxDiscountPercent: string;
    isActive?: boolean;
  }): Promise<TierDiscountRule> => {
    const res = await apiClient.post<ApiResponse<TierDiscountRule>>('/discount-rules/customer-tiers', data);
    return res.data.data!;
  },

  updateTierDiscountRule: async (
    id: string,
    data: { maxDiscountPercent?: string; isActive?: boolean }
  ): Promise<TierDiscountRule> => {
    const res = await apiClient.patch<ApiResponse<TierDiscountRule>>(`/discount-rules/customer-tiers/${id}`, data);
    return res.data.data!;
  },

  deleteTierDiscountRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/discount-rules/customer-tiers/${id}`);
  },

  getCategoryDiscountRules: async (): Promise<CategoryDiscountRule[]> => {
    const res = await apiClient.get<ApiResponse<CategoryDiscountRule[]>>('/discount-rules/categories');
    return res.data.data || [];
  },

  createCategoryDiscountRule: async (data: {
    categoryId: string;
    maxDiscountPercent: string;
    isActive?: boolean;
  }): Promise<CategoryDiscountRule> => {
    const res = await apiClient.post<ApiResponse<CategoryDiscountRule>>('/discount-rules/categories', data);
    return res.data.data!;
  },

  updateCategoryDiscountRule: async (
    id: string,
    data: { maxDiscountPercent?: string; isActive?: boolean }
  ): Promise<CategoryDiscountRule> => {
    const res = await apiClient.patch<ApiResponse<CategoryDiscountRule>>(`/discount-rules/categories/${id}`, data);
    return res.data.data!;
  },

  deleteCategoryDiscountRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/discount-rules/categories/${id}`);
  },

  // Module J: Warehouses
  getWarehouses: async (): Promise<Warehouse[]> => {
    const res = await apiClient.get<ApiResponse<Warehouse[]>>('/warehouses', {
      params: { limit: 100 },
    });
    return res.data.data || [];
  },

  createWarehouse: async (data: {
    name: string;
    code: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string;
    pincode?: string | null;
    priority?: number;
    isActive?: boolean;
  }): Promise<Warehouse> => {
    const res = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', data);
    return res.data.data!;
  },

  updateWarehouse: async (
    id: string,
    data: {
      name?: string;
      code?: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string;
      pincode?: string | null;
      priority?: number;
      isActive?: boolean;
    }
  ): Promise<Warehouse> => {
    const res = await apiClient.patch<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return res.data.data!;
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}`);
  },

  // Module K: Subscription Plans
  getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/subscription-plans', {
      params: { limit: 100 },
    });
    return res.data.data || [];
  },

  createSubscriptionPlan: async (data: {
    name: string;
    code: string;
    description?: string | null;
    billingInterval: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    price: string;
    currency?: string;
    features?: string[];
    isActive?: boolean;
  }): Promise<SubscriptionPlan> => {
    const res = await apiClient.post<ApiResponse<SubscriptionPlan>>('/subscription-plans', data);
    return res.data.data!;
  },

  updateSubscriptionPlan: async (
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string | null;
      billingInterval?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      price?: string;
      currency?: string;
      features?: string[];
      isActive?: boolean;
    }
  ): Promise<SubscriptionPlan> => {
    const res = await apiClient.patch<ApiResponse<SubscriptionPlan>>(`/subscription-plans/${id}`, data);
    return res.data.data!;
  },

  deleteSubscriptionPlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/subscription-plans/${id}`);
  },

  // Module L: System Settings
  getSystemSettings: async (): Promise<SystemSettings> => {
    const res = await apiClient.get<ApiResponse<SystemSettings>>('/admin/settings');
    return res.data.data!;
  },

  updateSystemSettings: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
    const res = await apiClient.patch<ApiResponse<SystemSettings>>('/admin/settings', data);
    return res.data.data!;
  },
};
