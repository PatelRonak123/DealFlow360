import {
  rolesRepository,
  RolesRepository,
  RoleWithDetails,
  SYSTEM_ROLES,
} from '../repositories/roles.repository.js';
import { CreateRoleInput, UpdateRoleInput } from '../validators/roles.validator.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../common/errors/index.js';
import { db } from '../../../database/db.js';
import { Permission, Role } from '../../../database/schema/index.js';

export interface GroupedPermissions {
  domain: string;
  items: Permission[];
}

export class RolesService {
  constructor(private readonly repository: RolesRepository = rolesRepository) {}

  async listRoles(): Promise<RoleWithDetails[]> {
    return this.repository.findAllRoles();
  }

  async getRoleById(id: string): Promise<RoleWithDetails> {
    const role = await this.repository.findRoleById(id);
    if (!role) {
      throw new NotFoundError(`Role with ID '${id}' not found`);
    }
    return role;
  }

  async createRole(data: CreateRoleInput): Promise<RoleWithDetails> {
    const normalizedName = data.name.trim().toUpperCase();
    const existing = await this.repository.findRoleByName(normalizedName);
    if (existing) {
      throw new ConflictError(`Role with name '${normalizedName}' already exists`);
    }

    return db.transaction(async (tx) => {
      const created = await this.repository.createRole(
        {
          name: normalizedName,
          description: data.description?.trim() || null,
        },
        tx as any
      );

      if (data.permissionIds && data.permissionIds.length > 0) {
        await this.repository.setRolePermissions(created.id, data.permissionIds, tx as any);
      }

      const fullRole = await this.repository.findRoleById(created.id, tx as any);
      return fullRole!;
    });
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<RoleWithDetails> {
    const role = await this.getRoleById(id);

    return db.transaction(async (tx) => {
      if (data.description !== undefined) {
        await this.repository.updateRole(
          id,
          { description: data.description?.trim() || null },
          tx as any
        );
      }

      if (data.permissionIds !== undefined) {
        // Prevent stripping all permissions from ADMIN system role
        if (role.name === 'ADMIN' && data.permissionIds.length === 0) {
          throw new BadRequestError('The ADMIN system role must maintain system permissions');
        }
        await this.repository.setRolePermissions(id, data.permissionIds, tx as any);
      }

      const updated = await this.repository.findRoleById(id, tx as any);
      return updated!;
    });
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);

    if (SYSTEM_ROLES.has(role.name)) {
      throw new BadRequestError(`System role '${role.name}' cannot be deleted`);
    }

    const assignedCount = await this.repository.countAssignedUsers(id);
    if (assignedCount > 0) {
      throw new BadRequestError(
        `Cannot delete role '${role.name}': It is currently assigned to ${assignedCount} user(s). Reassign them first.`
      );
    }

    await this.repository.deleteRole(id);
  }

  async listPermissionsGrouped(): Promise<{ flat: Permission[]; grouped: GroupedPermissions[] }> {
    const all = await this.repository.findAllPermissions();

    const groupsMap = new Map<string, Permission[]>();

    for (const perm of all) {
      const domain = perm.name.split(':')[0] || 'general';
      const capitalizedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
      if (!groupsMap.has(capitalizedDomain)) {
        groupsMap.set(capitalizedDomain, []);
      }
      groupsMap.get(capitalizedDomain)!.push(perm);
    }

    const grouped: GroupedPermissions[] = Array.from(groupsMap.entries()).map(
      ([domain, items]) => ({
        domain,
        items,
      })
    );

    return {
      flat: all,
      grouped,
    };
  }
}

export const rolesService = new RolesService();
