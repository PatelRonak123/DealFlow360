export type UserRole = 'sales_rep' | 'sales_manager' | 'finance_ops' | 'customer' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}