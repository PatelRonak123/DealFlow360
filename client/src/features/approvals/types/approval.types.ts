export type ApprovalLevel = 'MANAGER' | 'FINANCE' | 'VP';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PendingApprovalItem {
  id: string;
  quotationId: string;
  approvalLevel: ApprovalLevel;
  status: ApprovalStatus;
  requestedDiscountPercent: string;
  maxDiscountAllowed: string;
  thresholdExceeded: string;
  notes: string | null;
  assignedTo: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  comments: string | null;
  requestedAt: string;
  quotation: {
    id: string;
    quotationNumber: string;
    totalAmount: string;
    subtotal: string;
    discountAmount: string;
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
  };
}

export interface PendingApprovalsQueryParams {
  status?: ApprovalStatus;
  approvalLevel?: ApprovalLevel;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApprovePayload {
  comments?: string;
}

export interface RejectPayload {
  comments: string;
}
