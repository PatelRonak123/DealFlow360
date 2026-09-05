import { db, pool } from '../database/db.js';
import { users, customers, customerTiers } from '../database/schema/index.js';
import { eq } from 'drizzle-orm';
import { usersRepository } from '../modules/users/repositories/users.repository.js';

async function assignCompanyToCustomer(targetUserId?: string, targetCompanyName?: string): Promise<void> {
  const userId = targetUserId || process.argv[2] || 'c187185c-1261-4f91-97a1-eea1848ec85c';
  const companyName = targetCompanyName || process.argv[3] || 'Acme Global Technologies Ltd';

  console.log(`[ASSIGN] Starting company assignment for User ID: ${userId}...`);

  try {
    // 1. Fetch user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      console.error(`[ERROR] User with ID '${userId}' was not found in the database.`);
      return;
    }

    console.log(`[ASSIGN] Found User: ${user.name} (${user.email})`);

    // 2. Ensure at least one customer tier exists
    let tier = await db.query.customerTiers.findFirst();
    if (!tier) {
      console.log('[ASSIGN] No customer tier found. Creating default tier (Enterprise)...');
      const [newTier] = await db
        .insert(customerTiers)
        .values({
          name: 'Enterprise',
          description: 'Default Enterprise Tier for Customer Accounts',
          isActive: true,
        })
        .returning();
      tier = newTier;
    }

    // 3. Check if customer record exists for user email
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, user.email.toLowerCase()),
    });

    let customerId: string;

    if (existingCustomer) {
      console.log(`[ASSIGN] Updating existing customer record (${existingCustomer.id}) with company: "${companyName}"...`);
      const [updated] = await db
        .update(customers)
        .set({
          companyName,
          contactName: user.name,
          customerTierId: tier.id,
          status: 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(customers.id, existingCustomer.id))
        .returning();
      customerId = updated.id;
    } else {
      console.log(`[ASSIGN] Creating new customer record with company: "${companyName}"...`);
      const [created] = await db
        .insert(customers)
        .values({
          companyName,
          contactName: user.name,
          email: user.email.toLowerCase(),
          customerTierId: tier.id,
          status: 'ACTIVE',
        })
        .returning();
      customerId = created.id;
    }

    // 4. Verify updated user auth context
    const updatedContext = await usersRepository.getUserWithRolesAndPermissions(userId);

    console.log('\n========================================');
    console.log(' COMPANY ASSIGNMENT SUCCESSFUL');
    console.log('========================================');
    console.log(`User ID:        ${updatedContext?.userId}`);
    console.log(`Name:           ${updatedContext?.name}`);
    console.log(`Email:          ${updatedContext?.email}`);
    console.log(`Roles:          ${updatedContext?.roles.join(', ')}`);
    console.log(`Customer ID:    ${updatedContext?.customerId}`);
    console.log(`Company Name:   ${updatedContext?.customerName}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('[ERROR] Failed to assign company name to customer:', error);
  } finally {
    await pool.end();
  }
}

// Direct CLI execution
assignCompanyToCustomer();
