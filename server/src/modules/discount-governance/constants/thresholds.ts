export const GovernanceThresholds = {
  MANAGER_APPROVAL_THRESHOLD: 15.0, // Risk scores > 0 and <= 15.0 require MANAGER
  FINANCE_APPROVAL_THRESHOLD: 15.0, // Risk scores > 15.0 require MANAGER + FINANCE
  DEFAULT_FALLBACK_DISCOUNT_LIMIT: 0.0, // Safe default fallback when no tier/category rule is configured
} as const;

export const ApprovalRoutes = {
  NO_APPROVAL: 'NO_APPROVAL',
  MANAGER: 'MANAGER',
  MANAGER_AND_FINANCE: 'MANAGER_AND_FINANCE',
} as const;

export type ApprovalRoute = (typeof ApprovalRoutes)[keyof typeof ApprovalRoutes];
