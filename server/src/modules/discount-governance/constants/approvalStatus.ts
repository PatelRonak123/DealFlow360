export const ApprovalStatuses = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  INVALIDATED: 'INVALIDATED',
} as const;

export type ApprovalStatus = (typeof ApprovalStatuses)[keyof typeof ApprovalStatuses];
