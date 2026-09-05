import { db, Database } from '../../../database/db.js';
import { users, userRoles, customers, User, NewUser } from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
import { AuthUserContext } from '../../rbac/types/index.js';

interface CachedUserContext {
  context: AuthUserContext;
  expiresAt: number;
}

const userCache = new Map<string, CachedUserContext>();
const inFlightRequests = new Map<string, Promise<AuthUserContext | null>>();
const USER_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export class UsersRepository {
  invalidateCache(userId?: string): void {
    if (userId) {
      userCache.delete(userId);
    } else {
      userCache.clear();
    }
  }

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
    this.invalidateCache(userId);
  }

  async getUserWithRolesAndPermissions(id: string): Promise<AuthUserContext | null> {
    const cached = userCache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.context;
    }

    if (inFlightRequests.has(id)) {
      return inFlightRequests.get(id)!;
    }

    const fetchPromise = (async () => {
      try {
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

        // Check if user is associated with a customer entity
        let customerId: string | undefined;
        let customerName: string | undefined;

        try {
          const customerRecord = await db.query.customers.findFirst({
            where: eq(customers.email, user.email.toLowerCase()),
          });
          if (customerRecord) {
            customerId = customerRecord.id;
            customerName = customerRecord.companyName || customerRecord.contactName || undefined;
          }
        } catch {
          // Ignore customer lookup failure if schema or data differs
        }

        const result: AuthUserContext = {
          userId: user.id,
          email: user.email,
          name: user.name,
          roles: Array.from(roleNamesSet),
          permissions: Array.from(permissionNamesSet),
          customerId,
          customerName,
        };

        userCache.set(id, {
          context: result,
          expiresAt: Date.now() + USER_CACHE_TTL_MS,
        });

        return result;
      } finally {
        inFlightRequests.delete(id);
      }
    })();

    inFlightRequests.set(id, fetchPromise);
    return fetchPromise;
  }
}

export const usersRepository = new UsersRepository();
