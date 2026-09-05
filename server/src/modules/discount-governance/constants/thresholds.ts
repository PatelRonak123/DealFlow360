export const GovernanceThresholds = {
  AUTO_APPROVAL_THRESHOLD: 10.0, // Discounts <= 10.0% are automatically approved
  MANAGER_APPROVAL_THRESHOLD: 20.0, // Discounts between 11% and 20% require Sales Manager approval
  FINANCE_APPROVAL_THRESHOLD: 20.0, // Discounts > 20% require Finance Operations approval
  DEFAULT_FALLBACK_DISCOUNT_LIMIT: 10.0, // Standard sales rep delegated discount limit is 10.0%
} as const;

export const ApprovalRoutes = {
  NO_APPROVAL: 'NO_APPROVAL',
  MANAGER: 'MANAGER',
  MANAGER_AND_FINANCE: 'MANAGER_AND_FINANCE',
} as const;

export type ApprovalRoute = (typeof ApprovalRoutes)[keyof typeof ApprovalRoutes];
