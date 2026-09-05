import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import {
  PendingApprovalItem,
  PendingApprovalsQueryParams,
  ApprovePayload,
  RejectPayload,
} from '../types/approval.types';

export const approvalsApi = {
  getPendingApprovals: async (
    params?: PendingApprovalsQueryParams
  ): Promise<{ items: PendingApprovalItem[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await apiClient.get<ApiResponse<PendingApprovalItem[]>>('/approvals/pending', {
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

  approveApproval: async (id: string, payload?: ApprovePayload): Promise<unknown> => {
    const response = await apiClient.post<ApiResponse<unknown>>(`/approvals/${id}/approve`, payload || {});
    return response.data.data;
  },

  rejectApproval: async (id: string, payload: RejectPayload): Promise<unknown> => {
    const response = await apiClient.post<ApiResponse<unknown>>(`/approvals/${id}/reject`, payload);
    return response.data.data;
  },
};
