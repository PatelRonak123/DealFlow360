import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';
import { CustomerPortalPaginationParams } from '../types';

export const CUSTOMER_QUOTATIONS_QUERY_KEY = ['customer-portal', 'quotations'] as const;

export function useCustomerQuotations(params?: CustomerPortalPaginationParams) {
  return useQuery({
    queryKey: [...CUSTOMER_QUOTATIONS_QUERY_KEY, params?.search, params?.status, params?.page, params?.limit],
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
