import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import {
  BackendProductSummary,
  BackendPriceListSummary,
} from '@/features/quotations/types/quotationApi.types';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  productType?: 'ONE_TIME' | 'RECURRING' | 'SERVICE';
  isActive?: boolean;
}

export interface BackendCategorySummary {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export const productApi = {
  getProducts: async (
    params?: ProductQueryParams
  ): Promise<{ items: BackendProductSummary[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await apiClient.get<ApiResponse<BackendProductSummary[]>>('/products', {
      params: {
        ...params,
        isActive: params?.isActive !== undefined ? String(params.isActive) : undefined,
      },
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

  getCategories: async (): Promise<BackendCategorySummary[]> => {
    const response = await apiClient.get<ApiResponse<BackendCategorySummary[]>>('/categories', {
      params: { isActive: true },
    });
    return response.data.data || [];
  },
};
