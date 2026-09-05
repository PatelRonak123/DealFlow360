import { apiClient } from '@/api/apiClient';
import { GlobalSearchResponse } from '../types/search.types';

export const searchApi = {
  search: async (query: string): Promise<GlobalSearchResponse> => {
    if (!query || !query.trim()) {
      return {
        query: '',
        total: 0,
        results: {
          quotations: [],
          invoices: [],
          customers: [],
          products: [],
          users: [],
          subscriptions: [],
        },
      };
    }
    const res = await apiClient.get<{ success: boolean; data: GlobalSearchResponse }>('/search', {
      params: { q: query },
    });
    return res.data.data;
  },
};
