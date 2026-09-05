export const ApprovalLevels = {
  MANAGER: 'MANAGER',
  FINANCE: 'FINANCE',
} as const;

export type ApprovalLevel = (typeof ApprovalLevels)[keyof typeof ApprovalLevels];
