import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import { BackendCustomerSummary } from '@/features/quotations/types/quotationApi.types';

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  search?: string;
  customerTierId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export const customerApi = {
  getCustomers: async (
    params?: CustomerQueryParams
  ): Promise<{ items: BackendCustomerSummary[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await apiClient.get<ApiResponse<BackendCustomerSummary[]>>('/customers', {
      params,
    });
    const meta = response.data.meta;
    return {
      items: response.data.data || [],
      total: meta?.total ?? (response.data.data ? response.data.data.length : 0),
      page: meta?.page ?? 1,
      limit: meta?.limit ?? 10,
      totalPages: (meta as { totalPages?: number })?.totalPages ?? 1,
    };
  },

  getCustomerById: async (id: string): Promise<BackendCustomerSummary> => {
    const response = await apiClient.get<ApiResponse<BackendCustomerSummary>>(`/customers/${id}`);
    return response.data.data!;
  },
};
