export const Roles = {
  ADMIN: 'ADMIN',
  SALES_REP: 'SALES_REP',
  SALES_MANAGER: 'SALES_MANAGER',
  FINANCE: 'FINANCE',
  CUSTOMER: 'CUSTOMER',
} as const;

export type RoleName = (typeof Roles)[keyof typeof Roles];

export const DEFAULT_PUBLIC_ROLE: RoleName = Roles.CUSTOMER;

