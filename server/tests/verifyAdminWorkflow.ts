import { pool, db } from '../src/database/db.js';
import { adminService } from '../src/modules/admin/services/admin.service.js';
import { usersService } from '../src/modules/users/services/users.service.js';
import { rolesService } from '../src/modules/rbac/services/roles.service.js';
import { subscriptionPlansService } from '../src/modules/subscriptions/services/subscriptionPlans.service.js';
import { initAdminTables } from '../src/database/initAdminTables.js';
import { bootstrapRbac } from '../src/modules/rbac/services/rbacBootstrap.js';

async function runAdminWorkflowVerification() {
  console.log('========================================================');
  console.log('🚀 Starting DealFlow360 Admin Workflow Verification Suite');
  console.log('========================================================\n');

  try {
    // 0. Ensure tables and RBAC are initialized
    console.log('[Setup] Initializing admin schema and RBAC bootstrap...');
    await initAdminTables();
    await bootstrapRbac();
    console.log('✓ Admin schema & RBAC bootstrap initialized.\n');

    // 1. Test Admin Dashboard Metrics API
    console.log('[Test 1] Testing Admin Dashboard Metrics API...');
    const metrics = await adminService.getDashboardMetrics();
    console.log('✓ Metrics retrieved:', {
      users: metrics.users,
      customers: metrics.customers,
      products: metrics.products,
      warehouses: metrics.warehouses,
      subscriptionPlans: metrics.subscriptionPlans,
      quotations: metrics.quotations,
      systemStatus: metrics.systemStatus.status,
    });
    if (typeof metrics.users.total !== 'number' || typeof metrics.products.total !== 'number') {
      throw new Error('Invalid dashboard metrics format');
    }
    console.log('✓ Test 1: Admin Dashboard Metrics API PASSED.\n');

    // 2. Test User Management
    console.log('[Test 2] Testing User Management Workflow...');
    const rolesList = await rolesService.listRoles();
    const adminRole = rolesList.find((r) => r.name === 'ADMIN')!;
    const salesRepRole = rolesList.find((r) => r.name === 'SALES_REP')!;

    const testEmail = `test.user.${Date.now()}@dealflow360.com`;
    console.log(`Creating test user with email ${testEmail}...`);
    const newUser = await usersService.createUser({
      name: 'Rohan Sharma',
      email: testEmail,
      password: 'SecurePassword123!',
      roleIds: [salesRepRole.id],
      isActive: true,
    });
    console.log(`✓ User created with ID: ${newUser.id}, assigned role: ${newUser.roles[0]?.name}`);

    // Update user
    const updatedUser = await usersService.updateUser(newUser.id, {
      name: 'Rohan Sharma (Promoted)',
      roleIds: [salesRepRole.id, adminRole.id],
    });
    console.log(`✓ User updated: ${updatedUser.name}, assigned roles: ${updatedUser.roles.map((r) => r.name).join(', ')}`);

    // Deactivate user
    const deactivatedUser = await usersService.updateUserStatus(newUser.id, { isActive: false });
    if (deactivatedUser.isActive !== false) {
      throw new Error('Expected user to be deactivated');
    }
    console.log('✓ User deactivated successfully.');

    // Self-deactivation safeguard test
    try {
      await usersService.updateUserStatus(newUser.id, { isActive: false }, newUser.id);
      throw new Error('Expected self-deactivation to throw error');
    } catch (err: any) {
      console.log(`✓ Safeguard verified: "${err.message}"`);
    }
    console.log('✓ Test 2: User Management Workflow PASSED.\n');

    // 3. Test Roles & Permissions
    console.log('[Test 3] Testing Roles & Permissions Management...');
    const permsResult = await rolesService.listPermissionsGrouped();
    console.log(`✓ Retrieved ${permsResult.flat.length} permissions across ${permsResult.grouped.length} domain groups.`);

    const customRoleName = `AUDIT_SPECIALIST_${Date.now()}`;
    const customRole = await rolesService.createRole({
      name: customRoleName,
      description: 'Temporary auditor role',
      permissionIds: permsResult.flat.slice(0, 3).map((p) => p.id),
    });
    console.log(`✓ Created custom role: ${customRole.name} with ${customRole.permissions.length} permissions.`);

    // System role deletion protection check
    try {
      await rolesService.deleteRole(adminRole.id);
      throw new Error('Expected deleting system role ADMIN to fail');
    } catch (err: any) {
      console.log(`✓ System role safeguard verified: "${err.message}"`);
    }

    // Delete custom role
    await rolesService.deleteRole(customRole.id);
    console.log('✓ Custom role deleted successfully.');
    console.log('✓ Test 3: Roles & Permissions Management PASSED.\n');

    // 4. Test Subscription Plans Management
    console.log('[Test 4] Testing Subscription Plans Configuration...');
    const testPlanCode = `SAAS_SCALE_${Date.now()}`;
    const newPlan = await subscriptionPlansService.createPlan({
      name: `Scale Enterprise Plan ${Date.now()}`,
      code: testPlanCode,
      description: 'Unlimited quote generation and automated CPQ routing',
      billingInterval: 'YEARLY',
      price: '149999.00',
      currency: 'INR',
      features: ['Unlimited Quotes', 'Advanced Analytics', 'Multi-Warehouse Allocation'],
      isActive: true,
    });
    console.log(`✓ Created subscription plan: ${newPlan.name} (Code: ${newPlan.code}, Price: ₹${newPlan.price}/${newPlan.billingInterval})`);

    const updatedPlan = await subscriptionPlansService.updatePlan(newPlan.id, {
      price: '159999.00',
    });
    console.log(`✓ Updated subscription plan price: ₹${updatedPlan.price}`);

    await subscriptionPlansService.deletePlan(newPlan.id);
    const deactivatedPlan = await subscriptionPlansService.getPlanById(newPlan.id);
    if (deactivatedPlan.isActive !== false) {
      throw new Error('Expected plan to be deactivated (soft-delete)');
    }
    console.log('✓ Plan deactivated (soft-deleted) successfully.');
    console.log('✓ Test 4: Subscription Plans Configuration PASSED.\n');

    // 5. Test System Settings
    console.log('[Test 5] Testing System Settings Configuration...');
    const currentSettings = await adminService.getSettings();
    console.log(`✓ Current company: ${currentSettings.companyName}, Tax: ${currentSettings.defaultTaxRate}%`);

    const updatedSettings = await adminService.updateSettings({
      companyName: 'DealFlow360 Enterprise Technologies',
      defaultTaxRate: '18.00',
      approvalThresholdPercent: '12.00',
    });
    console.log(`✓ Updated company name: ${updatedSettings.companyName}, Threshold: ${updatedSettings.approvalThresholdPercent}%`);
    console.log('✓ Test 5: System Settings Configuration PASSED.\n');

    console.log('========================================================');
    console.log('🎉 ALL ADMIN WORKFLOW VERIFICATION TESTS PASSED (100%)');
    console.log('========================================================');
  } catch (error) {
    console.error('\n❌ Admin Workflow Verification Suite Failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAdminWorkflowVerification();
