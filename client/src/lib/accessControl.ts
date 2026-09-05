import { UserRole, AuthUser } from '@/types/Auth';

/**
 * Standard normalized role strings - Strictly 5 canonical roles
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  SALES_REP: 'SALES_REP',
  SALES_MANAGER: 'SALES_MANAGER',
  FINANCE: 'FINANCE',
  CUSTOMER: 'CUSTOMER',
} as const;

/**
 * Standardize any arbitrary role string or legacy alias into canonical uppercase role
 */
export function normalizeRole(roleStr?: string): UserRole {
  if (!roleStr) return ROLES.SALES_REP;
  const clean = roleStr.toUpperCase().replace(/[\s-]/g, '_');

  if (clean.includes('ADMIN')) return ROLES.ADMIN;
  if (clean.includes('MANAGER') || clean.includes('DIRECTOR')) return ROLES.SALES_MANAGER;
  if (clean.includes('CUSTOMER') || clean.includes('CLIENT')) return ROLES.CUSTOMER;
  if (clean.includes('FINANCE')) return ROLES.FINANCE;
  if (clean.includes('SALES') || clean.includes('REP')) return ROLES.SALES_REP;

  return ROLES.SALES_REP;
}

/**
 * Get normalized role set for the given roles array
 */
export function getNormalizedRoleSet(roles: (UserRole | string)[]): Set<string> {
  const set = new Set<string>();
  for (const r of roles) {
    const norm = normalizeRole(r);
    set.add(norm);
  }
  return set;
}

/**
 * Check if the user has a specific role
 */
export function hasRole(user: AuthUser | null | undefined, targetRole: UserRole | string): boolean {
  if (!user) return false;
  const normTarget = normalizeRole(targetRole);
  const userRoles = getNormalizedRoleSet(user.roles && user.roles.length > 0 ? user.roles : [user.role]);

  if (userRoles.has(ROLES.ADMIN)) return true;
  return userRoles.has(normTarget);
}

/**
 * Check if the user has any of the allowed roles
 */
export function hasAnyRole(
  user: AuthUser | null | undefined,
  allowedRoles: (UserRole | string)[]
): boolean {
  if (!user) return false;
  if (allowedRoles.length === 0) return true;

  const userRoles = getNormalizedRoleSet(user.roles && user.roles.length > 0 ? user.roles : [user.role]);

  // Admin has global access to internal workspace features
  if (userRoles.has(ROLES.ADMIN)) return true;

  return allowedRoles.some((target) => userRoles.has(normalizeRole(target)));
}

/**
 * Check if the user has a specific permission
 */
export function hasPermission(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  const userRoles = getNormalizedRoleSet(user.roles && user.roles.length > 0 ? user.roles : [user.role]);
  if (userRoles.has(ROLES.ADMIN)) return true;

  return user.permissions ? user.permissions.includes(permission) : false;
}

/**
 * Check if the user has all required permissions
 */
export function hasAllPermissions(
  user: AuthUser | null | undefined,
  permissions: string[]
): boolean {
  if (!user) return false;
  const userRoles = getNormalizedRoleSet(user.roles && user.roles.length > 0 ? user.roles : [user.role]);
  if (userRoles.has(ROLES.ADMIN)) return true;

  return permissions.every((p) => user.permissions?.includes(p));
}

/**
 * Determine the primary role for initial redirection
 */
export function getPrimaryRole(roles: (UserRole | string)[]): UserRole {
  if (!roles || roles.length === 0) return ROLES.SALES_REP;
  const roleSet = getNormalizedRoleSet(roles);

  if (roleSet.has(ROLES.ADMIN)) return ROLES.ADMIN;
  if (roleSet.has(ROLES.SALES_MANAGER)) return ROLES.SALES_MANAGER;
  if (roleSet.has(ROLES.FINANCE)) return ROLES.FINANCE;
  if (roleSet.has(ROLES.SALES_REP)) return ROLES.SALES_REP;
  if (roleSet.has(ROLES.CUSTOMER)) return ROLES.CUSTOMER;

  return normalizeRole(roles[0]);
}

/**
 * Get dedicated dashboard path for a role
 */
export function getDashboardPathForRole(role: UserRole | string): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.SALES_MANAGER:
      return '/manager/dashboard';
    case ROLES.FINANCE:
      return '/finance/dashboard';
    case ROLES.CUSTOMER:
      return '/customer/dashboard';
    case ROLES.SALES_REP:
    default:
      return '/sales/dashboard';
  }
}

/**
 * Helper to check if role is external customer
 */
export function isCustomerRole(role: UserRole | string): boolean {
  return normalizeRole(role) === ROLES.CUSTOMER;
}

/**
 * Get display title for a role
 */
export function getRoleTitle(role: UserRole | string): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case ROLES.ADMIN:
      return 'System Administrator';
    case ROLES.SALES_MANAGER:
      return 'Sales Manager';
    case ROLES.FINANCE:
      return 'Finance Officer';
    case ROLES.CUSTOMER:
      return 'Customer';
    case ROLES.SALES_REP:
    default:
      return 'Sales Representative';
  }
}
