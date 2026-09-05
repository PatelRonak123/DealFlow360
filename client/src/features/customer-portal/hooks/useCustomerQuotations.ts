import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';

export const CUSTOMER_QUOTATIONS_QUERY_KEY = ['customer-portal', 'quotations'] as const;

export function useCustomerQuotations(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: [...CUSTOMER_QUOTATIONS_QUERY_KEY, params?.search, params?.status],
    queryFn: () => customerPortalApi.getQuotations(params),
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ['customer-portal', 'quotations', id],
    queryFn: () => customerPortalApi.getQuotationById(id),
    enabled: Boolean(id),
  });
}
