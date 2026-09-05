import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';
import { CustomerPortalPaginationParams } from '../types';

export const CUSTOMER_ORDERS_QUERY_KEY = ['customer-portal', 'orders'] as const;

export function useCustomerOrders(params?: CustomerPortalPaginationParams) {
  return useQuery({
    queryKey: [...CUSTOMER_ORDERS_QUERY_KEY, params?.search, params?.status, params?.page, params?.limit],
    queryFn: () => customerPortalApi.getOrders(params),
  });
}

export function useCustomerOrder(id: string) {
  return useQuery({
    queryKey: ['customer-portal', 'orders', id],
    queryFn: () => customerPortalApi.getOrderById(id),
    enabled: Boolean(id),
  });
}
