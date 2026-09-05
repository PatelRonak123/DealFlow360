import { db, Database } from '../../../database/db.js';
import { users, userRoles, roles, customers, User, NewUser, Role } from '../../../database/schema/index.js';
import { eq, ilike, or, desc, count, and } from 'drizzle-orm';
import { AuthUserContext } from '../../rbac/types/index.js';
import { UserQueryInput } from '../validators/users.validator.js';

interface CachedUserContext {
  context: AuthUserContext;
  expiresAt: number;
}

const userCache = new Map<string, CachedUserContext>();
const inFlightRequests = new Map<string, Promise<AuthUserContext | null>>();
const USER_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export interface UserWithRoles extends Omit<User, 'passwordHash'> {
  roles: Role[];
}

export interface PaginatedUsers {
  items: UserWithRoles[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UsersRepository {
  invalidateCache(userId?: string): void {
    if (userId) {
      userCache.delete(userId);
    } else {
      userCache.clear();
    }
  }

  async findAll(query: UserQueryInput, client: Database = db): Promise<PaginatedUsers> {
    const { page = 1, limit = 20, search, role, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await client
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const rawUsers = await client.query.users.findMany({
      where: whereClause,
      orderBy: [desc(users.createdAt)],
      limit,
      offset,
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    let items: UserWithRoles[] = rawUsers.map((u) => {
      const { passwordHash: _hash, userRoles: uRoles, ...rest } = u as any;
      return {
        ...rest,
        roles: (uRoles || []).map((ur: any) => ur.role).filter(Boolean),
      };
    });

    // Optional role filtering in memory if role query was supplied
    if (role) {
      items = items.filter((u) =>
        u.roles.some((r) => r.name.toLowerCase() === role.toLowerCase())
      );
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findByIdWithRoles(id: string, client: Database = db): Promise<UserWithRoles | undefined> {
    const user = await client.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!user) return undefined;

    const { passwordHash: _hash, userRoles: uRoles, ...rest } = user as any;
    return {
      ...rest,
      roles: (uRoles || []).map((ur: any) => ur.role).filter(Boolean),
    };
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

  async update(id: string, data: Partial<NewUser>, client: Database = db): Promise<User | undefined> {
    const [updated] = await client
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    this.invalidateCache(id);
    return updated;
  }

  async assignRoles(userId: string, roleIds: string[], client: Database = db): Promise<void> {
    await client.delete(userRoles).where(eq(userRoles.userId, userId));
    if (roleIds.length > 0) {
      await client.insert(userRoles).values(
        roleIds.map((roleId) => ({
          userId,
          roleId,
        }))
      );
    }
    this.invalidateCache(userId);
  }

  async assignRole(userId: string, roleId: string, client: Database = db): Promise<void> {
    await client
      .insert(userRoles)
      .values({
        userId,
        roleId,
      })
      .onConflictDoNothing();
    this.invalidateCache(userId);
  }

  async countActiveAdmins(client: Database = db): Promise<number> {
    const adminRole = await client.query.roles.findFirst({
      where: eq(roles.name, 'ADMIN'),
    });
    if (!adminRole) return 0;

    const adminUserRoles = await client.query.userRoles.findMany({
      where: eq(userRoles.roleId, adminRole.id),
      with: {
        user: true,
      },
    });

    return adminUserRoles.filter((ur) => ur.user && ur.user.isActive).length;
  }

  async getUserMetrics(client: Database = db): Promise<{ total: number; active: number; inactive: number }> {
    const allUsers = await client.select({ isActive: users.isActive }).from(users);
    const total = allUsers.length;
    const active = allUsers.filter((u) => u.isActive).length;
    return {
      total,
      active,
      inactive: total - active,
    };
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

        let customerId: string | undefined;
        let customerName: string | undefined;

        try {
          const normalizedEmail = user.email.toLowerCase();
          const customerRecord = await db.query.customers.findFirst({
            where: eq(customers.email, normalizedEmail),
          });
          if (customerRecord) {
            customerId = customerRecord.id;
            customerName = customerRecord.companyName || customerRecord.contactName || undefined;
          } else {
            const domain = normalizedEmail.split('@')[1];
            const genericDomains = new Set([
              'gmail.com',
              'yahoo.com',
              'outlook.com',
              'hotmail.com',
              'icloud.com',
              'aol.com',
              'mail.com',
              'protonmail.com',
              'zoho.com',
              'dealflow360.io',
            ]);
            if (domain && !genericDomains.has(domain)) {
              const allCustomers = await db.query.customers.findMany();
              const domainCustomer = allCustomers.find(
                (c) => c.email && c.email.toLowerCase().endsWith(`@${domain}`)
              );
              if (domainCustomer) {
                customerId = domainCustomer.id;
                customerName = domainCustomer.companyName || domainCustomer.contactName || undefined;
              }
            }
          }
        } catch {
          // Ignore customer lookup failure
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
