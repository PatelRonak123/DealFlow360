export const CustomerStatuses = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type CustomerStatus = (typeof CustomerStatuses)[keyof typeof CustomerStatuses];
