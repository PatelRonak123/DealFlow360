import { db } from '../../../database/db.js';
import { roles, permissions, rolePermissions } from '../../../database/schema/index.js';
import { Roles, RoleName } from '../constants/roles.js';
import { Permissions, PermissionName } from '../constants/permissions.js';
import { eq } from 'drizzle-orm';

interface RoleDefinition {
  name: RoleName;
  description: string;
  permissions: PermissionName[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: Roles.ADMIN,
    description: 'Full administrative access across all DealFlow360 platform domains',
    permissions: Object.values(Permissions),
  },
  {
    name: Roles.SALES_REP,
    description: 'Sales representative with quote creation and customer/product access',
    permissions: [
      Permissions.USER_READ,
      Permissions.CUSTOMER_TIER_READ,
      Permissions.CATEGORY_READ,
      Permissions.PRODUCT_READ,
      Permissions.CUSTOMER_READ,
      Permissions.PRICE_LIST_READ,
      Permissions.DISCOUNT_RULE_READ,
      Permissions.QUOTATION_CREATE,
      Permissions.QUOTATION_READ,
      Permissions.QUOTATION_UPDATE,
      Permissions.QUOTATION_DELETE,
      Permissions.QUOTATION_SEND,
      Permissions.QUOTATION_SUBMIT,
      Permissions.QUOTATION_EVALUATE,
      Permissions.APPROVAL_READ,
      Permissions.RECOMMENDATION_READ,
      Permissions.RECOMMENDATION_ACCEPT,
      Permissions.RECOMMENDATION_DISMISS,
      Permissions.INVENTORY_READ,
      Permissions.WAREHOUSE_READ,
      Permissions.FULFILLMENT_READ,
    ],
  },
  {
    name: Roles.SALES_MANAGER,
    description: 'Sales management with quote approval and discount governance permissions',
    permissions: [
      Permissions.USER_READ,
      Permissions.CUSTOMER_TIER_READ,
      Permissions.CATEGORY_READ,
      Permissions.CATEGORY_MANAGE,
      Permissions.PRODUCT_READ,
      Permissions.PRODUCT_MANAGE,
      Permissions.CUSTOMER_READ,
      Permissions.CUSTOMER_MANAGE,
      Permissions.PRICE_LIST_READ,
      Permissions.PRICE_LIST_MANAGE,
      Permissions.DISCOUNT_RULE_READ,
      Permissions.DISCOUNT_RULE_MANAGE,
      Permissions.QUOTATION_CREATE,
      Permissions.QUOTATION_READ,
      Permissions.QUOTATION_UPDATE,
      Permissions.QUOTATION_DELETE,
      Permissions.QUOTATION_SEND,
      Permissions.QUOTATION_SUBMIT,
      Permissions.QUOTATION_EVALUATE,
      Permissions.QUOTATION_APPROVE,
      Permissions.APPROVAL_READ,
      Permissions.APPROVAL_APPROVE,
      Permissions.APPROVAL_REJECT,
      Permissions.DISCOUNT_APPROVE,
      Permissions.RECOMMENDATION_READ,
      Permissions.RECOMMENDATION_ACCEPT,
      Permissions.RECOMMENDATION_DISMISS,
      Permissions.RECOMMENDATION_MANAGE,
      Permissions.RECOMMENDATION_RULE_CREATE,
      Permissions.RECOMMENDATION_RULE_READ,
      Permissions.RECOMMENDATION_RULE_UPDATE,
      Permissions.RECOMMENDATION_RULE_DELETE,
      Permissions.REPORTS_VIEW,
      Permissions.INVENTORY_READ,
      Permissions.WAREHOUSE_READ,
      Permissions.FULFILLMENT_READ,
      Permissions.FULFILLMENT_CREATE,
      Permissions.FULFILLMENT_UPDATE,
      Permissions.FULFILLMENT_CANCEL,
    ],
  },
  {
    name: Roles.FINANCE,
    description: 'Finance officer with billing, pricing oversight, and discount approvals',
    permissions: [
      Permissions.USER_READ,
      Permissions.CUSTOMER_TIER_READ,
      Permissions.CATEGORY_READ,
      Permissions.PRODUCT_READ,
      Permissions.CUSTOMER_READ,
      Permissions.PRICE_LIST_READ,
      Permissions.PRICE_LIST_MANAGE,
      Permissions.DISCOUNT_RULE_READ,
      Permissions.DISCOUNT_RULE_MANAGE,
      Permissions.QUOTATION_READ,
      Permissions.QUOTATION_APPROVE,
      Permissions.APPROVAL_READ,
      Permissions.APPROVAL_APPROVE,
      Permissions.APPROVAL_REJECT,
      Permissions.DISCOUNT_APPROVE,
      Permissions.DISCOUNT_OVERRIDE,
      Permissions.BILLING_READ,
      Permissions.BILLING_MANAGE,
      Permissions.PAYMENT_PROCESS,
      Permissions.WAREHOUSE_READ,
      Permissions.WAREHOUSE_MANAGE,
      Permissions.INVENTORY_READ,
      Permissions.INVENTORY_MANAGE,
      Permissions.INVENTORY_ADJUST,
      Permissions.FULFILLMENT_READ,
      Permissions.FULFILLMENT_CREATE,
      Permissions.FULFILLMENT_UPDATE,
      Permissions.FULFILLMENT_CANCEL,
      Permissions.FULFILLMENT_COMPLETE,
      Permissions.FULFILLMENT_MANAGE,
      Permissions.REPORTS_VIEW,
      Permissions.AUDIT_VIEW,
    ],
  },
  {
    name: Roles.CUSTOMER,
    description: 'External customer portal access for reviewing and accepting quotes',
    permissions: [
      Permissions.QUOTATION_READ,
      Permissions.BILLING_READ,
    ],
  },
];

export async function bootstrapRbac(): Promise<void> {
  console.log('[RBAC] Starting idempotent RBAC bootstrap...');

  // 1. Seed or update permissions in bulk
  const allPermissions = Object.values(Permissions);
  const existingPerms = await db.select().from(permissions);
  const existingPermNames = new Set(existingPerms.map((p) => p.name));

  const newPerms = allPermissions
    .filter((name) => !existingPermNames.has(name))
    .map((name) => ({
      name,
      description: `Permission for ${name}`,
    }));

  if (newPerms.length > 0) {
    await db.insert(permissions).values(newPerms);
  }

  // Refresh permissions map
  const allPermsList = await db.select().from(permissions);
  const permMap = new Map(allPermsList.map((p) => [p.name, p.id]));

  // 2. Seed or update roles & assign role_permissions
  const existingRoles = await db.select().from(roles);
  const roleMap = new Map(existingRoles.map((r) => [r.name, r.id]));

  for (const roleDef of ROLE_DEFINITIONS) {
    let roleId = roleMap.get(roleDef.name);

    if (!roleId) {
      const [inserted] = await db
        .insert(roles)
        .values({
          name: roleDef.name,
          description: roleDef.description,
        })
        .returning();
      roleId = inserted.id;
      roleMap.set(roleDef.name, roleId);
    }

    // Existing role permissions
    const currentMappings = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    const currentPermIds = new Set(currentMappings.map((m) => m.permissionId));

    const toInsert = roleDef.permissions
      .map((pName) => permMap.get(pName))
      .filter((pId): pId is string => Boolean(pId) && !currentPermIds.has(pId!))
      .map((permissionId) => ({
        roleId,
        permissionId,
      }));

    if (toInsert.length > 0) {
      await db.insert(rolePermissions).values(toInsert);
    }
  }

  console.log('[RBAC] RBAC bootstrap completed successfully.');
}
