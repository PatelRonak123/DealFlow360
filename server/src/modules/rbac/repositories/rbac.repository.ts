import { db } from '../../../database/db.js';
import { roles, Role } from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
import { RoleName } from '../constants/roles.js';

export class RbacRepository {
  async findRoleByName(name: RoleName | string): Promise<Role | undefined> {
    return db.query.roles.findFirst({
      where: eq(roles.name, name),
    });
  }
}

export const rbacRepository = new RbacRepository();
