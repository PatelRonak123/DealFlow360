import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import {
  BackendProductSummary,
  BackendPriceListSummary,
} from '@/features/quotations/types/quotationApi.types';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  productType?: 'ONE_TIME' | 'RECURRING' | 'SERVICE';
  isActive?: boolean;
}

export const productApi = {
  getProducts: async (params?: ProductQueryParams): Promise<{ items: BackendProductSummary[]; total: number }> => {
    const response = await apiClient.get<ApiResponse<BackendProductSummary[]>>('/products', {
      params: {
        ...params,
        isActive: params?.isActive !== undefined ? String(params.isActive) : undefined,
      },
    });
    return {
      items: response.data.data || [],
      total: response.data.meta?.total || (response.data.data ? response.data.data.length : 0),
    };
  },

  getProductById: async (id: string): Promise<BackendProductSummary> => {
    const response = await apiClient.get<ApiResponse<BackendProductSummary>>(`/products/${id}`);
    return response.data.data!;
  },

  getPriceLists: async (): Promise<BackendPriceListSummary[]> => {
    const response = await apiClient.get<ApiResponse<BackendPriceListSummary[]>>('/price-lists', {
      params: { isActive: true },
    });
    return response.data.data || [];
  },
};
