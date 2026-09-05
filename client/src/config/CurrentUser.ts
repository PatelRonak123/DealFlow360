import { UserRole } from '@/types/Auth';

// TEMP: hardcoded until login is wired up. Change this to preview other roles.
export const CURRENT_ROLE: UserRole = 'sales_rep';

export const CURRENT_USER = {
  name: 'Riya Sharma',
  role: CURRENT_ROLE,
  avatarUrl: undefined as string | undefined,
};