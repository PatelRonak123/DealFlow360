import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';

export interface NegotiationItem {
  id: string;
  quotationId: string;
  quotationNumber: string;
  quotationVersionNumber: number;
  quotationStatus: string;
  quotationSubtotal: string;
  quotationDiscountAmount: string;
  quotationTotalAmount: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  requestedDiscountPercent: number;
  requestedChanges: string[];
  customerMessage: string;
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'DECLINED' | 'REVISION_CREATED' | 'APPROVED' | string;
  repResponse?: string;
  revisedQuotationId?: string;
  revisedQuotationNumber?: string;
  revisedQuotationStatus?: string;
  handledByName?: string;
  handledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NegotiationQueryParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const negotiationsApi = {
  getNegotiations: async (
    params?: NegotiationQueryParams
  ): Promise<{ items: NegotiationItem[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await apiClient.get<ApiResponse<NegotiationItem[]>>('/negotiations', {
      params,
    });
    const meta = response.data.meta;
    return {
      items: response.data.data || [],
      total: meta?.total || (response.data.data ? response.data.data.length : 0),
      page: meta?.page || 1,
      limit: meta?.limit || 20,
      totalPages: (meta as { totalPages?: number })?.totalPages || 1,
    };
  },

  getNegotiationById: async (id: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/negotiations/${id}`);
    return response.data.data;
  },

  declineNegotiation: async (id: string, repResponse: string): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>(`/negotiations/${id}/decline`, {
      repResponse,
    });
    return response.data.data;
  },

  createRevision: async (id: string): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>(`/negotiations/${id}/create-revision`);
    return response.data.data;
  },
};
