import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import { BackendCustomerSummary } from '@/features/quotations/types/quotationApi.types';

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  customerTierId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export const customerApi = {
  getCustomers: async (params?: CustomerQueryParams): Promise<{ items: BackendCustomerSummary[]; total: number }> => {
    const response = await apiClient.get<ApiResponse<BackendCustomerSummary[]>>('/customers', {
      params,
    });
    return {
      items: response.data.data || [],
      total: response.data.meta?.total || (response.data.data ? response.data.data.length : 0),
    };
  },

  getCustomerById: async (id: string): Promise<BackendCustomerSummary> => {
    const response = await apiClient.get<ApiResponse<BackendCustomerSummary>>(`/customers/${id}`);
    return response.data.data!;
  },
};
