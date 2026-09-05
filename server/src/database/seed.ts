import { bootstrapRbac } from '../modules/rbac/index.js';
import { db, pool } from './db.js';
import { users, userRoles, roles } from './schema/index.js';
import { hashPassword } from '../modules/auth/utils/password.utils.js';
import { Roles } from '../modules/rbac/constants/roles.js';
import { eq } from 'drizzle-orm';

const SEED_USERS = [
  {
    name: 'Platform Administrator',
    email: 'admin@dealflow360.io',
    password: 'Password@123',
    role: Roles.ADMIN,
  },
  {
    name: 'Sales Representative',
    email: 'sales.rep@dealflow360.io',
    password: 'Password@123',
    role: Roles.SALES_REP,
  },
  {
    name: 'Sales Manager',
    email: 'sales.manager@dealflow360.io',
    password: 'Password@123',
    role: Roles.SALES_MANAGER,
  },
  {
    name: 'Finance Officer',
    email: 'finance@dealflow360.io',
    password: 'Password@123',
    role: Roles.FINANCE,
  },
  {
    name: 'Customer Procurement',
    email: 'customer@dealflow360.io',
    password: 'Password@123',
    role: Roles.CUSTOMER,
  },
];

async function seedDatabase(): Promise<void> {
  console.log('Starting system initialization & RBAC bootstrap...');
  try {
    // 1. Bootstrap all 5 RBAC roles and granular permissions
    await bootstrapRbac();

    // 2. Query all roles from database
    const allDbRoles = await db.select().from(roles);
    const roleMap = new Map(allDbRoles.map((r) => [r.name, r.id]));

    // 3. Seed/update the 5 canonical users
    const defaultPasswordHash = await hashPassword('Password@123');

    for (const u of SEED_USERS) {
      const roleId = roleMap.get(u.role);
      if (!roleId) {
        console.warn(`Role ${u.role} not found in DB, skipping user ${u.email}`);
        continue;
      }

      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);

      let userId: string;
      if (existing.length > 0) {
        userId = existing[0].id;
        // Update password & name
        await db
          .update(users)
          .set({
            name: u.name,
            passwordHash: defaultPasswordHash,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        const [inserted] = await db
          .insert(users)
          .values({
            name: u.name,
            email: u.email,
            passwordHash: defaultPasswordHash,
            isActive: true,
          })
          .returning();
        userId = inserted.id;
      }

      // Assign user role
      await db
        .insert(userRoles)
        .values({
          userId,
          roleId,
        })
        .onConflictDoNothing();

      console.log(`[SEED] Configured user: ${u.email} -> Role: ${u.role}`);
    }

    console.log('System initialization and user seeding completed successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();

export { seedDatabase };
