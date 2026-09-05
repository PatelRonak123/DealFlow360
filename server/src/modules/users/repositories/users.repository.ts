import { db, Database } from '../../../database/db.js';
import { users, userRoles, User, NewUser } from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
import { AuthUserContext } from '../../rbac/types/index.js';

export class UsersRepository {
  async findById(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    return db.query.users.findFirst({
      where: eq(users.email, normalized),
    });
  }

  async create(userData: NewUser, client: Database = db): Promise<User> {
    const normalized = {
      ...userData,
      email: userData.email.trim().toLowerCase(),
    };
    const [user] = await client.insert(users).values(normalized).returning();
    return user;
  }

  async assignRole(userId: string, roleId: string, client: Database = db): Promise<void> {
    await client.insert(userRoles).values({
      userId,
      roleId,
    }).onConflictDoNothing();
  }

  async getUserWithRolesAndPermissions(id: string): Promise<AuthUserContext | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        userRoles: {
          with: {
            role: {
              with: {
                rolePermissions: {
                  with: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const roleNamesSet = new Set<string>();
    const permissionNamesSet = new Set<string>();

    if (user.userRoles && Array.isArray(user.userRoles)) {
      for (const ur of user.userRoles) {
        if (ur.role) {
          roleNamesSet.add(ur.role.name);
          if (ur.role.rolePermissions && Array.isArray(ur.role.rolePermissions)) {
            for (const rp of ur.role.rolePermissions) {
              if (rp.permission) {
                permissionNamesSet.add(rp.permission.name);
              }
            }
          }
        }
      }
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: Array.from(roleNamesSet),
      permissions: Array.from(permissionNamesSet),
    };
  }
}

export const usersRepository = new UsersRepository();
