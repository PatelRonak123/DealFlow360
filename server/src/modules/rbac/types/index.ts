export * from '../constants/roles.js';
export * from '../constants/permissions.js';

export interface AuthUserContext {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}
