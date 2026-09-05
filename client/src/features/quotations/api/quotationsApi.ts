import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import {
  BackendQuotation,
  BackendQuotationItem,
  CreateQuotationPayload,
  UpdateQuotationPayload,
  AddQuotationItemPayload,
  UpdateQuotationItemPayload,
  SubmitQuotationPayload,
  QuotationSubmissionResult,
  QuotationApprovalItem,
  QuotationDiscountEvaluation,
  QuotationQueryParams,
} from '../types/quotationApi.types';

export const quotationsApi = {
  // List quotations (scoped on backend for sales rep to their own)
  getQuotations: async (
    params?: QuotationQueryParams
  ): Promise<{ items: BackendQuotation[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await apiClient.get<ApiResponse<BackendQuotation[]>>('/quotations', {
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

  // Get single quotation by ID with lines and customer populated
  getQuotationById: async (id: string): Promise<BackendQuotation> => {
    const response = await apiClient.get<ApiResponse<BackendQuotation>>(`/quotations/${id}`);
    return response.data.data!;
  },

  // Create quotation header
  createQuotation: async (payload: CreateQuotationPayload): Promise<BackendQuotation> => {
    const response = await apiClient.post<ApiResponse<BackendQuotation>>('/quotations', payload);
    return response.data.data!;
  },

  // Update quotation header
  updateQuotation: async (id: string, payload: UpdateQuotationPayload): Promise<BackendQuotation> => {
    const response = await apiClient.patch<ApiResponse<BackendQuotation>>(`/quotations/${id}`, payload);
    return response.data.data!;
  },

  // Cancel quotation
  cancelQuotation: async (id: string): Promise<BackendQuotation> => {
    const response = await apiClient.delete<ApiResponse<BackendQuotation>>(`/quotations/${id}`);
    return response.data.data!;
  },

  // Add line item (automatically recalculates quotation totals on backend)
  addItem: async (
    quotationId: string,
    payload: AddQuotationItemPayload
  ): Promise<{ item: BackendQuotationItem; quotation: BackendQuotation }> => {
    const response = await apiClient.post<ApiResponse<{ item: BackendQuotationItem; quotation: BackendQuotation }>>(
      `/quotations/${quotationId}/items`,
      payload
    );
    return response.data.data!;
  },

  // Update line item
  updateItem: async (
    quotationId: string,
    itemId: string,
    payload: UpdateQuotationItemPayload
  ): Promise<{ item: BackendQuotationItem; quotation: BackendQuotation }> => {
    const response = await apiClient.patch<ApiResponse<{ item: BackendQuotationItem; quotation: BackendQuotation }>>(
      `/quotations/${quotationId}/items/${itemId}`,
      payload
    );
    return response.data.data!;
  },

  // Delete line item
  deleteItem: async (
    quotationId: string,
    itemId: string
  ): Promise<{ quotation: BackendQuotation }> => {
    const response = await apiClient.delete<ApiResponse<{ quotation: BackendQuotation }>>(
      `/quotations/${quotationId}/items/${itemId}`
    );
    return response.data.data!;
  },

  // Submit quotation into discount governance approval workflow
  submitQuotation: async (
    id: string,
    payload?: SubmitQuotationPayload
  ): Promise<QuotationSubmissionResult> => {
    const response = await apiClient.post<ApiResponse<QuotationSubmissionResult>>(
      `/quotations/${id}/submit`,
      payload || {}
    );
    return response.data.data!;
  },

  // Get approval steps & audit log
  getApprovals: async (id: string): Promise<QuotationApprovalItem[]> => {
    const response = await apiClient.get<ApiResponse<QuotationApprovalItem[]>>(`/quotations/${id}/approvals`);
    return response.data.data || [];
  },

  // Get discount governance evaluation
  getDiscountEvaluation: async (id: string): Promise<QuotationDiscountEvaluation> => {
    const response = await apiClient.get<ApiResponse<QuotationDiscountEvaluation>>(
      `/quotations/${id}/discount-evaluation`
    );
    return response.data.data!;
  },
};
