import {
  usersRepository,
  UsersRepository,
  PaginatedUsers,
  UserWithRoles,
} from '../repositories/users.repository.js';
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  UserQueryInput,
} from '../validators/users.validator.js';
import { hashPassword } from '../../auth/utils/password.utils.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../common/errors/index.js';
import { db } from '../../../database/db.js';

export class UsersService {
  constructor(private readonly repository: UsersRepository = usersRepository) {}

  async listUsers(query: UserQueryInput): Promise<PaginatedUsers> {
    return this.repository.findAll(query);
  }

  async getUserById(id: string): Promise<UserWithRoles> {
    const user = await this.repository.findByIdWithRoles(id);
    if (!user) {
      throw new NotFoundError(`User with ID '${id}' not found`);
    }
    return user;
  }

  async createUser(data: CreateUserInput): Promise<UserWithRoles> {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`User with email '${data.email}' already exists`);
    }

    const passwordHash = await hashPassword(data.password);

    return db.transaction(async (tx) => {
      const created = await this.repository.create(
        {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          passwordHash,
          isActive: data.isActive ?? true,
        },
        tx as any
      );

      if (data.roleIds && data.roleIds.length > 0) {
        await this.repository.assignRoles(created.id, data.roleIds, tx as any);
      }

      const fullUser = await this.repository.findByIdWithRoles(created.id, tx as any);
      return fullUser!;
    });
  }

  async updateUser(
    id: string,
    data: UpdateUserInput,
    requestingUserId?: string
  ): Promise<UserWithRoles> {
    const user = await this.getUserById(id);

    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await this.repository.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictError(`User with email '${data.email}' already exists`);
      }
    }

    // Role modification safety check
    if (data.roleIds) {
      const isCurrentlyAdmin = user.roles.some((r) => r.name === 'ADMIN');
      // If user is currently an admin, check if the update removes admin role
      if (isCurrentlyAdmin) {
        const activeAdmins = await this.repository.countActiveAdmins();
        if (activeAdmins <= 1 && user.isActive) {
          // Verify if new roles still contain admin role
          // Note: we check if they are removing admin role while being the last admin
          const allRoles = await db.query.roles.findMany();
          const newRoleNames = data.roleIds.map((rid) => allRoles.find((r) => r.id === rid)?.name);
          if (!newRoleNames.includes('ADMIN')) {
            throw new BadRequestError('Cannot remove Admin role: At least one active Administrator must remain');
          }
        }
      }
    }

    // Status safety check
    if (data.isActive === false) {
      this.assertCanDeactivateUser(user, requestingUserId);
    }

    const passwordHash = data.password ? await hashPassword(data.password) : undefined;

    return db.transaction(async (tx) => {
      await this.repository.update(
        id,
        {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
          ...(passwordHash ? { passwordHash } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        tx as any
      );

      if (data.roleIds) {
        await this.repository.assignRoles(id, data.roleIds, tx as any);
      }

      const updated = await this.repository.findByIdWithRoles(id, tx as any);
      return updated!;
    });
  }

  async updateUserStatus(
    id: string,
    data: UpdateUserStatusInput,
    requestingUserId?: string
  ): Promise<UserWithRoles> {
    const user = await this.getUserById(id);

    if (data.isActive === false) {
      await this.assertCanDeactivateUser(user, requestingUserId);
    }

    await this.repository.update(id, { isActive: data.isActive });
    const updated = await this.getUserById(id);
    return updated;
  }

  async deleteUser(id: string, requestingUserId?: string): Promise<void> {
    const user = await this.getUserById(id);
    await this.assertCanDeactivateUser(user, requestingUserId);

    // Soft delete: deactivate user
    await this.repository.update(id, { isActive: false });
  }

  private async assertCanDeactivateUser(
    user: UserWithRoles,
    requestingUserId?: string
  ): Promise<void> {
    if (requestingUserId && user.id === requestingUserId) {
      throw new BadRequestError('You cannot deactivate your own administrative account');
    }

    const isAdmin = user.roles.some((r) => r.name === 'ADMIN');
    if (isAdmin) {
      const activeAdmins = await this.repository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new BadRequestError(
          'Cannot deactivate the last remaining active Administrator in the system'
        );
      }
    }
  }
}

export const usersService = new UsersService();
