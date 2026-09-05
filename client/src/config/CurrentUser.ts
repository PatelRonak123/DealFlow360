import { UserRole } from '@/types/Auth';

// Default customer role preview for customer portal
export const CURRENT_ROLE: UserRole = 'customer';

export const CURRENT_USER = {
  name: 'Vikram Mehta (ABC Industries)',
  role: CURRENT_ROLE,
  avatarUrl: undefined as string | undefined,
};