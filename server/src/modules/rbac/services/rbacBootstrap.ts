import { db } from '../../../database/db.js';
import { roles, permissions, rolePermissions } from '../../../database/schema/index.js';
import { Roles, RoleName } from '../constants/roles.js';
import { Permissions, PermissionName } from '../constants/permissions.js';
import { eq, and } from 'drizzle-orm';

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
      Permissions.INVENTORY_READ,
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
      Permissions.REPORTS_VIEW,
      Permissions.INVENTORY_READ,
    ],
  },
  {
    name: Roles.FINANCE_OPERATIONS,
    description: 'Financial and operations officer with billing and pricing oversight',
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
      Permissions.INVENTORY_READ,
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

  // 1. Seed or update permissions
  const allPermissions = Object.values(Permissions);
  for (const permName of allPermissions) {
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.name, permName),
    });

    if (!existing) {
      await db.insert(permissions).values({
        name: permName,
        description: `Permission for ${permName}`,
      });
    }
  }

  // 2. Seed or update roles & assign role_permissions
  for (const roleDef of ROLE_DEFINITIONS) {
    let roleRecord = await db.query.roles.findFirst({
      where: eq(roles.name, roleDef.name),
    });

    if (!roleRecord) {
      const [inserted] = await db
        .insert(roles)
        .values({
          name: roleDef.name,
          description: roleDef.description,
        })
        .returning();
      roleRecord = inserted;
    }

    // Assign permissions to this role
    for (const permName of roleDef.permissions) {
      const permRecord = await db.query.permissions.findFirst({
        where: eq(permissions.name, permName),
      });

      if (permRecord) {
        const existingMapping = await db.query.rolePermissions.findFirst({
          where: and(
            eq(rolePermissions.roleId, roleRecord.id),
            eq(rolePermissions.permissionId, permRecord.id)
          ),
        });

        if (!existingMapping) {
          await db.insert(rolePermissions).values({
            roleId: roleRecord.id,
            permissionId: permRecord.id,
          });
        }
      }
    }
  }

  console.log('[RBAC] RBAC bootstrap completed successfully.');
}
