import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  users: (params?: unknown) => [...adminKeys.all, 'users', params] as const,
  user: (id: string) => [...adminKeys.all, 'user', id] as const,
  roles: () => [...adminKeys.all, 'roles'] as const,
  role: (id: string) => [...adminKeys.all, 'role', id] as const,
  permissions: () => [...adminKeys.all, 'permissions'] as const,
  categories: () => [...adminKeys.all, 'categories'] as const,
  products: (params?: unknown) => [...adminKeys.all, 'products', params] as const,
  priceLists: () => [...adminKeys.all, 'priceLists'] as const,
  priceList: (id: string) => [...adminKeys.all, 'priceList', id] as const,
  priceListItems: (id: string) => [...adminKeys.all, 'priceListItems', id] as const,
  customerTiers: () => [...adminKeys.all, 'customerTiers'] as const,
  tierDiscountRules: () => [...adminKeys.all, 'tierDiscountRules'] as const,
  categoryDiscountRules: () => [...adminKeys.all, 'categoryDiscountRules'] as const,
  warehouses: () => [...adminKeys.all, 'warehouses'] as const,
  subscriptionPlans: () => [...adminKeys.all, 'subscriptionPlans'] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
};

// Module A: Dashboard Metrics
export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => adminApi.getDashboardMetrics(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

// Module B: Users
export function useAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.getUsers(params),
  });
}

export function useAdminUser(id?: string) {
  return useQuery({
    queryKey: adminKeys.user(id || ''),
    queryFn: () => adminApi.getUserById(id!),
    enabled: Boolean(id),
  });
}

// Module C & D: Roles & Permissions
export function useAdminRoles() {
  return useQuery({
    queryKey: adminKeys.roles(),
    queryFn: () => adminApi.getRoles(),
  });
}

export function useAdminRole(id?: string) {
  return useQuery({
    queryKey: adminKeys.role(id || ''),
    queryFn: () => adminApi.getRoleById(id!),
    enabled: Boolean(id),
  });
}

export function useAdminPermissions() {
  return useQuery({
    queryKey: adminKeys.permissions(),
    queryFn: () => adminApi.getPermissions(),
    staleTime: 1000 * 60 * 10,
  });
}

// Module E: Categories
export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories(),
    queryFn: () => adminApi.getCategories(),
  });
}

// Module F: Products
export function useAdminProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: adminKeys.products(params),
    queryFn: () => adminApi.getProducts(params),
  });
}

// Module G: Price Lists
export function useAdminPriceLists() {
  return useQuery({
    queryKey: adminKeys.priceLists(),
    queryFn: () => adminApi.getPriceLists(),
  });
}

export function useAdminPriceList(id?: string) {
  return useQuery({
    queryKey: adminKeys.priceList(id || ''),
    queryFn: () => adminApi.getPriceListById(id!),
    enabled: Boolean(id),
  });
}

export function useAdminPriceListItems(priceListId?: string) {
  return useQuery({
    queryKey: adminKeys.priceListItems(priceListId || ''),
    queryFn: () => adminApi.getPriceListItems(priceListId!),
    enabled: Boolean(priceListId),
  });
}

// Module H: Customer Tiers
export function useAdminCustomerTiers() {
  return useQuery({
    queryKey: adminKeys.customerTiers(),
    queryFn: () => adminApi.getCustomerTiers(),
  });
}

// Module I: Discount Rules
export function useAdminTierDiscountRules() {
  return useQuery({
    queryKey: adminKeys.tierDiscountRules(),
    queryFn: () => adminApi.getTierDiscountRules(),
  });
}

export function useAdminCategoryDiscountRules() {
  return useQuery({
    queryKey: adminKeys.categoryDiscountRules(),
    queryFn: () => adminApi.getCategoryDiscountRules(),
  });
}

// Module J: Warehouses
export function useAdminWarehouses() {
  return useQuery({
    queryKey: adminKeys.warehouses(),
    queryFn: () => adminApi.getWarehouses(),
  });
}

// Module K: Subscription Plans
export function useAdminSubscriptionPlans() {
  return useQuery({
    queryKey: adminKeys.subscriptionPlans(),
    queryFn: () => adminApi.getSubscriptionPlans(),
  });
}

// Module L: System Settings
export function useAdminSettings() {
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: () => adminApi.getSystemSettings(),
  });
}
