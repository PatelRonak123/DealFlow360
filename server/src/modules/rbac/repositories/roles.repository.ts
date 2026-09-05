import { db, Database } from '../../../database/db.js';
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  Role,
  Permission,
} from '../../../database/schema/index.js';
import { eq, count, asc } from 'drizzle-orm';
import { usersRepository } from '../../users/repositories/users.repository.js';

export interface RoleWithDetails extends Role {
  isSystemRole: boolean;
  permissions: Permission[];
  assignedUsersCount: number;
}

export const SYSTEM_ROLES = new Set(['ADMIN', 'SALES_REP', 'SALES_MANAGER', 'FINANCE', 'CUSTOMER']);

export class RolesRepository {
  async findAllRoles(client: Database = db): Promise<RoleWithDetails[]> {
    const rawRoles = await client.query.roles.findMany({
      orderBy: [asc(roles.name)],
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
        userRoles: true,
      },
    });

    return rawRoles.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      isSystemRole: SYSTEM_ROLES.has(r.name),
      permissions: (r.rolePermissions || [])
        .map((rp: any) => rp.permission)
        .filter(Boolean),
      assignedUsersCount: (r.userRoles || []).length,
    }));
  }

  async findRoleById(id: string, client: Database = db): Promise<RoleWithDetails | undefined> {
    const r: any = await client.query.roles.findFirst({
      where: eq(roles.id, id),
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
        userRoles: true,
      },
    });

    if (!r) return undefined;

    return {
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      isSystemRole: SYSTEM_ROLES.has(r.name),
      permissions: (r.rolePermissions || [])
        .map((rp: any) => rp.permission)
        .filter(Boolean),
      assignedUsersCount: (r.userRoles || []).length,
    };
  }

  async findRoleByName(name: string, client: Database = db): Promise<Role | undefined> {
    return client.query.roles.findFirst({
      where: eq(roles.name, name),
    });
  }

  async createRole(data: { name: string; description?: string | null }, client: Database = db): Promise<Role> {
    const [created] = await client.insert(roles).values(data).returning();
    return created;
  }

  async updateRole(
    id: string,
    data: { description?: string | null },
    client: Database = db
  ): Promise<Role | undefined> {
    const [updated] = await client
      .update(roles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();

    return updated;
  }

  async setRolePermissions(
    roleId: string,
    permissionIds: string[],
    client: Database = db
  ): Promise<void> {
    await client.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (permissionIds.length > 0) {
      await client.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        }))
      );
    }
    usersRepository.invalidateCache();
  }

  async countAssignedUsers(roleId: string, client: Database = db): Promise<number> {
    const [result] = await client
      .select({ count: count() })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));
    return Number(result?.count || 0);
  }

  async deleteRole(id: string, client: Database = db): Promise<boolean> {
    const result = await client.delete(roles).where(eq(roles.id, id)).returning();
    usersRepository.invalidateCache();
    return result.length > 0;
  }

  async findAllPermissions(client: Database = db): Promise<Permission[]> {
    return client.query.permissions.findMany({
      orderBy: [asc(permissions.name)],
    });
  }
}

export const rolesRepository = new RolesRepository();
