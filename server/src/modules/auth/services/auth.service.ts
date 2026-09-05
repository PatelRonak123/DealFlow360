import { db } from '../../../database/db.js';
import { users, userRoles, refreshTokens, customers, customerTiers } from '../../../database/schema/index.js';
import { usersRepository } from '../../users/repositories/users.repository.js';
import { refreshTokensRepository } from '../repositories/refreshTokens.repository.js';
import { rbacRepository } from '../../rbac/repositories/rbac.repository.js';
import { bootstrapRbac } from '../../rbac/services/rbacBootstrap.js';
import { hashPassword, comparePassword } from '../utils/password.utils.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashRefreshToken,
} from '../utils/token.utils.js';
import { DEFAULT_PUBLIC_ROLE } from '../../rbac/constants/roles.js';
import { ConflictError, UnauthorizedError, NotFoundError, AppError } from '../../../common/errors/index.js';
import { AuthUserContext } from '../../rbac/types/index.js';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  companyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUserContext;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await usersRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // 1. Ensure default role exists in DB (self-heal with bootstrap if not found)
    let defaultRole = await rbacRepository.findRoleByName(DEFAULT_PUBLIC_ROLE);
    if (!defaultRole) {
      await bootstrapRbac();
      defaultRole = await rbacRepository.findRoleByName(DEFAULT_PUBLIC_ROLE);
      if (!defaultRole) {
        throw new AppError(
          `Default system role '${DEFAULT_PUBLIC_ROLE}' is missing. Please contact administrator.`,
          500,
          'SYSTEM_CONFIGURATION_ERROR'
        );
      }
    }

    const passwordHash = await hashPassword(input.password);

    // 2. Execute User Creation, Role Assignment, and Refresh Token storage inside a single transaction
    const { createdUserId, rawRefreshToken } = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          name: input.name.trim(),
          email: normalizedEmail,
          passwordHash,
          isActive: true,
        })
        .returning();

      await tx.insert(userRoles).values({
        userId: createdUser.id,
        roleId: defaultRole!.id,
      }).onConflictDoNothing();

      // Ensure customer company record exists
      if (defaultRole!.name === DEFAULT_PUBLIC_ROLE) {
        let defaultTier = await tx.query.customerTiers.findFirst();
        if (!defaultTier) {
          const [createdTier] = await tx.insert(customerTiers).values({
            name: 'Enterprise',
            description: 'Default Customer Tier',
            isActive: true,
          }).returning();
          defaultTier = createdTier;
        }

        const companyName = input.companyName?.trim() || `${input.name.trim()} Technologies`;

        await tx.insert(customers).values({
          companyName,
          contactName: input.name.trim(),
          email: normalizedEmail,
          customerTierId: defaultTier.id,
          status: 'ACTIVE',
        }).onConflictDoNothing();
      }

      const rawToken = generateRefreshTokenString();
      const tokenHash = hashRefreshToken(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await tx.insert(refreshTokens).values({
        userId: createdUser.id,
        tokenHash,
        expiresAt,
      });

      return { createdUserId: createdUser.id, rawRefreshToken: rawToken };
    });

    // 3. Load full user context with assigned roles and permissions
    const userContext = await usersRepository.getUserWithRolesAndPermissions(createdUserId);
    if (!userContext) {
      throw new Error('Failed to retrieve created user authorization context');
    }

    // Guarantee that the default role is in the response
    if (userContext.roles.length === 0) {
      userContext.roles = [DEFAULT_PUBLIC_ROLE];
    }

    const accessToken = generateAccessToken({
      userId: userContext.userId,
      email: userContext.email,
    });

    return {
      user: userContext,
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await usersRepository.findByEmail(normalizedEmail);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const userContext = await usersRepository.getUserWithRolesAndPermissions(user.id);
    if (!userContext) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = generateAccessToken({
      userId: userContext.userId,
      email: userContext.email,
    });

    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await refreshTokensRepository.create({
      userId: userContext.userId,
      tokenHash,
      expiresAt,
    });

    return {
      user: userContext,
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refreshTokens(rawRefreshToken: string): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const activeToken = await refreshTokensRepository.findActiveByTokenHash(tokenHash);

    if (!activeToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const userContext = await usersRepository.getUserWithRolesAndPermissions(activeToken.userId);
    if (!userContext) {
      throw new UnauthorizedError('User associated with token not found');
    }

    // Refresh Token Rotation: Revoke previous token and generate new token pair
    await refreshTokensRepository.revoke(activeToken.id);

    const newAccessToken = generateAccessToken({
      userId: userContext.userId,
      email: userContext.email,
    });

    const newRawRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await refreshTokensRepository.create({
      userId: userContext.userId,
      tokenHash: newTokenHash,
      expiresAt,
    });

    return {
      user: userContext,
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      await refreshTokensRepository.revokeByTokenHash(tokenHash);
    }
  }

  async getCurrentUser(userId: string): Promise<AuthUserContext> {
    const user = await usersRepository.getUserWithRolesAndPermissions(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}

export const authService = new AuthService();
