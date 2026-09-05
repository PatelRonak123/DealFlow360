import { useQuery } from '@tanstack/react-query';
import { customerApi, CustomerQueryParams } from '../api/customerApi';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: CustomerQueryParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useCustomers(params?: CustomerQueryParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerApi.getCustomers(params),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id || ''),
    queryFn: () => customerApi.getCustomerById(id!),
    enabled: Boolean(id),
  });
}
