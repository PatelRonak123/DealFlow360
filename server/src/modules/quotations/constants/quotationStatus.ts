export const QuotationStatuses = {
  DRAFT: 'DRAFT',
  PENDING_MANAGER_APPROVAL: 'PENDING_MANAGER_APPROVAL',
  PENDING_FINANCE_APPROVAL: 'PENDING_FINANCE_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SENT: 'SENT',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type QuotationStatus = (typeof QuotationStatuses)[keyof typeof QuotationStatuses];
