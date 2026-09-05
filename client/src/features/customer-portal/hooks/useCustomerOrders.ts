import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';

export const CUSTOMER_ORDERS_QUERY_KEY = ['customer-portal', 'orders'] as const;

export function useCustomerOrders() {
  return useQuery({
    queryKey: CUSTOMER_ORDERS_QUERY_KEY,
    queryFn: () => customerPortalApi.getOrders(),
  });
}

export function useCustomerOrder(id: string) {
  return useQuery({
    queryKey: ['customer-portal', 'orders', id],
    queryFn: () => customerPortalApi.getOrderById(id),
    enabled: Boolean(id),
  });
}
