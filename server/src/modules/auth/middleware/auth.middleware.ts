import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.utils.js';
import { usersRepository } from '../../users/repositories/users.repository.js';
import { UnauthorizedError, ForbiddenError } from '../../../common/errors/index.js';
import { Roles } from '../../rbac/constants/roles.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    const payload = verifyAccessToken(token);

    const userContext = await usersRepository.getUserWithRolesAndPermissions(payload.userId);
    if (!userContext) {
      throw new UnauthorizedError('User identity not found or inactive');
    }

    req.user = userContext;
    next();
  } catch (error) {
    next(error);
  }
}

function normalizeRoleName(r: string): string {
  return r.trim().toUpperCase().replace(/[\s-]/g, '_');
}

export function requireRole(...allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map(normalizeRoleName);

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRoles = req.user.roles.map(normalizeRoleName);
    const userRoleSet = new Set<string>(userRoles);

    // Role match or Admin override
    const hasRole =
      userRoleSet.has(Roles.ADMIN) ||
      normalizedAllowed.some((role) => userRoleSet.has(role));

    if (!hasRole) {
      return next(new ForbiddenError('Access denied: insufficient role privileges'));
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // ADMIN bypass or all required permissions match
    const isAdmin = req.user.roles.map(normalizeRoleName).includes(Roles.ADMIN);
    const hasAllPermissions =
      isAdmin ||
      requiredPermissions.every((perm) => req.user!.permissions.includes(perm));

    if (!hasAllPermissions) {
      return next(new ForbiddenError('Access denied: missing required permissions'));
    }

    next();
  };
}

