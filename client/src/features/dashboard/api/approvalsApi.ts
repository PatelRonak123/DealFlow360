import { apiClient } from '@/api/apiClient';

export interface BackendApprovalQuotation {
  id: string;
  quotationNumber: string;
  subtotal?: string;
  discountAmount?: string;
  totalAmount: string;
  discountPercent?: string;
  status: string;
  currency: string;
  customerId: string;
  createdById: string;
  customer?: {
    id: string;
    companyName: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BackendPendingApprovalItem {
  id: string;
  quotationId: string;
  approvalLevel: string;
  status: string;
  sequence: number;
  requestedAt: string;
  decidedAt: string | null;
  decidedById: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  quotation?: BackendApprovalQuotation;
}

export interface PendingApprovalsResponse {
  success: boolean;
  message: string;
  data: BackendPendingApprovalItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApprovalActionResponse {
  success: boolean;
  message: string;
  data: {
    approval: BackendPendingApprovalItem;
    quotationStatus: string;
    remainingApprovalsCount?: number;
  };
}

export const approvalsApi = {
  /**
   * Fetch all pending approvals for the current authenticated user's role
   */
  async fetchPendingApprovals(): Promise<BackendPendingApprovalItem[]> {
    const response = await apiClient.get<PendingApprovalsResponse>('/approvals/pending');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch pending approvals');
    }
    return response.data.data;
  },

  /**
   * Approve a pending approval step with optional comment
   */
  async approveApproval(approvalId: string, comments?: string): Promise<ApprovalActionResponse['data']> {
    const response = await apiClient.post<ApprovalActionResponse>(`/approvals/${approvalId}/approve`, {
      comments: comments?.trim() || undefined,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to approve quotation discount');
    }
    return response.data.data;
  },

  /**
   * Reject a pending approval step with required rejection justification
   */
  async rejectApproval(approvalId: string, comments: string): Promise<ApprovalActionResponse['data']> {
    const response = await apiClient.post<ApprovalActionResponse>(`/approvals/${approvalId}/reject`, {
      comments: comments.trim(),
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to reject quotation discount');
    }
    return response.data.data;
  },
};

export default approvalsApi;
