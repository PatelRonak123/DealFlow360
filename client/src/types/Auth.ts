export type UserRole =
  | 'ADMIN'
  | 'SALES_REP'
  | 'SALES_MANAGER'
  | 'FINANCE'
  | 'CUSTOMER'
  | 'admin'
  | 'sales_rep'
  | 'sales_manager'
  | 'finance'
  | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  permissions: string[];
  activeRole: UserRole;
  customer?: {
    id: string;
    companyName: string;
  };
  avatarUrl?: string;
  title?: string;
}