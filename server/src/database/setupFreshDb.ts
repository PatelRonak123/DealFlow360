import { db, pool } from './db.js';
import { sql } from 'drizzle-orm';
import { bootstrapRbac } from '../modules/rbac/index.js';
import { hashPassword } from '../modules/auth/utils/password.utils.js';
import { Roles } from '../modules/rbac/constants/roles.js';
import {
  users,
  roles,
  userRoles,
  customerTiers,
  productCategories,
  products,
  customers,
  warehouses,
  systemSettings,
  subscriptionPlans,
} from './schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * DealFlow360 — Fresh Database Initialization Script
 * 
 * Usage:
 *   npx tsx src/database/setupFreshDb.ts
 *   or: npm run db:setup
 * 
 * Automatically applies:
 * 1. Complete relational schema for all 32+ tables with strict foreign keys, cascading rules, unique indexes & check constraints.
 * 2. Idempotent RBAC permissions bootstrap (55+ granular permissions across 20 system domain modules).
 * 3. Seed users for all 5 roles (Admin, Sales Rep, Sales Manager, Finance, Customer) with Password@123.
 * 4. Master default configuration: System Settings, Customer Tiers, Product Categories, Warehouses, Catalog Products, and Subscription Plans.
 */

export async function setupFreshDatabase(): Promise<void> {
  console.log('================================================================');
  console.log('🚀 DealFlow360 — Starting Complete Fresh Database Setup');
  console.log('================================================================');

  try {
    // 1. Enable required PostgreSQL extensions
    await db.execute(sql.raw(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `));
    console.log('✓ PostgreSQL UUID extensions verified.');

    // 2. Execute Complete Table DDL with all constraints and indexes
    console.log('Applying complete table schemas and relational constraints...');
    await db.execute(sql.raw(`
      -- 1. Users Table
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        email varchar(255) NOT NULL UNIQUE,
        password_hash varchar(255) NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      -- 2. Roles Table
      CREATE TABLE IF NOT EXISTS roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL UNIQUE,
        description text,
        is_system boolean DEFAULT false NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

      -- 3. Permissions Table
      CREATE TABLE IF NOT EXISTS permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(100) NOT NULL UNIQUE,
        name varchar(255) NOT NULL,
        description text,
        module varchar(100) NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
      CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

      -- 4. User Roles Join Table
      CREATE TABLE IF NOT EXISTS user_roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

      -- 5. Role Permissions Join Table
      CREATE TABLE IF NOT EXISTS role_permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
      );
      CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

      -- 6. Refresh Tokens Table
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token varchar(500) NOT NULL UNIQUE,
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

      -- 7. Customer Tiers Table
      CREATE TABLE IF NOT EXISTS customer_tiers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL UNIQUE,
        description text,
        min_annual_spend numeric(12, 2) DEFAULT '0.00' NOT NULL,
        badge_color varchar(50) DEFAULT 'blue' NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 8. Product Categories Table
      CREATE TABLE IF NOT EXISTS product_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL UNIQUE,
        description text,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 9. Products Master Table
      CREATE TABLE IF NOT EXISTS products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        sku varchar(100) NOT NULL UNIQUE,
        description text,
        category_id uuid NOT NULL REFERENCES product_categories(id),
        product_type varchar(50) DEFAULT 'PHYSICAL' NOT NULL,
        base_price numeric(12, 2) NOT NULL,
        currency varchar(10) DEFAULT 'INR' NOT NULL,
        stock integer DEFAULT 0 NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

      -- 10. Customers Table
      CREATE TABLE IF NOT EXISTS customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name varchar(255) NOT NULL,
        contact_name varchar(255),
        email varchar(255) NOT NULL UNIQUE,
        phone varchar(50),
        customer_tier_id uuid NOT NULL REFERENCES customer_tiers(id),
        status varchar(50) DEFAULT 'ACTIVE' NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_tier_id ON customers(customer_tier_id);

      -- 11. Price Lists Table
      CREATE TABLE IF NOT EXISTS price_lists (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        code varchar(50) NOT NULL UNIQUE,
        description text,
        currency varchar(10) DEFAULT 'INR' NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        effective_from timestamp with time zone,
        effective_to timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 12. Price List Items Table
      CREATE TABLE IF NOT EXISTS price_list_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        price_list_id uuid NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        price numeric(12, 2) NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT uq_price_list_product UNIQUE (price_list_id, product_id)
      );
      CREATE INDEX IF NOT EXISTS idx_price_list_items_list_id ON price_list_items(price_list_id);

      -- 13. Customer Tier Discount Rules Table
      CREATE TABLE IF NOT EXISTS customer_tier_discount_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tier_id uuid NOT NULL REFERENCES customer_tiers(id) ON DELETE CASCADE,
        max_discount_percent numeric(5, 2) NOT NULL,
        requires_approval_above_percent numeric(5, 2) NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT uq_tier_discount_rule UNIQUE (tier_id)
      );

      -- 14. Category Discount Rules Table
      CREATE TABLE IF NOT EXISTS category_discount_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
        max_discount_percent numeric(5, 2) NOT NULL,
        requires_approval_above_percent numeric(5, 2) NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT uq_category_discount_rule UNIQUE (category_id)
      );

      -- 15. Quotations Table
      CREATE TABLE IF NOT EXISTS quotations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_number varchar(50) NOT NULL UNIQUE,
        customer_id uuid NOT NULL REFERENCES customers(id),
        price_list_id uuid NOT NULL REFERENCES price_lists(id),
        status varchar(50) DEFAULT 'DRAFT' NOT NULL,
        currency varchar(10) DEFAULT 'INR' NOT NULL,
        subtotal numeric(12, 2) DEFAULT '0.00' NOT NULL,
        discount_amount numeric(12, 2) DEFAULT '0.00' NOT NULL,
        total_amount numeric(12, 2) DEFAULT '0.00' NOT NULL,
        issue_date date NOT NULL,
        expiry_date date NOT NULL,
        notes text,
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
      CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);
      CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

      -- 16. Quotation Items Table
      CREATE TABLE IF NOT EXISTS quotation_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id),
        product_name_snapshot varchar(255) NOT NULL,
        sku_snapshot varchar(100) NOT NULL,
        quantity integer NOT NULL,
        unit_price numeric(12, 2) NOT NULL,
        discount_percent numeric(5, 2) DEFAULT '0.00' NOT NULL,
        gross_amount numeric(12, 2) NOT NULL,
        discount_amount numeric(12, 2) NOT NULL,
        net_amount numeric(12, 2) NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);

      -- 17. Quotation Approvals Table
      CREATE TABLE IF NOT EXISTS quotation_approvals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        required_role varchar(50) NOT NULL,
        sequence integer DEFAULT 1 NOT NULL,
        status varchar(50) DEFAULT 'PENDING' NOT NULL,
        requested_discount_percent numeric(5, 2) NOT NULL,
        requested_by_id uuid NOT NULL REFERENCES users(id),
        approved_by_id uuid REFERENCES users(id),
        action_reason text,
        actioned_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_quotation_approvals_quotation_id ON quotation_approvals(quotation_id);
      CREATE INDEX IF NOT EXISTS idx_quotation_approvals_status ON quotation_approvals(status);

      -- 18. Quotation Discount Evaluations Table
      CREATE TABLE IF NOT EXISTS quotation_discount_evaluations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        quotation_item_id uuid NOT NULL REFERENCES quotation_items(id) ON DELETE CASCADE,
        effective_allowed_discount numeric(5, 2) NOT NULL,
        excess_discount numeric(5, 2) NOT NULL,
        is_violation boolean DEFAULT false NOT NULL,
        risk_contribution numeric(12, 2) NOT NULL,
        evaluated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 19. Recommendation Rules Table
      CREATE TABLE IF NOT EXISTS recommendation_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        trigger_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        recommended_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rule_type varchar(50) NOT NULL,
        score integer DEFAULT 50 NOT NULL,
        rationale text NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 20. Recommendation Events Table
      CREATE TABLE IF NOT EXISTS recommendation_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        trigger_product_id uuid NOT NULL REFERENCES products(id),
        recommended_product_id uuid NOT NULL REFERENCES products(id),
        rule_type varchar(50) NOT NULL,
        action varchar(50) NOT NULL,
        rep_id uuid NOT NULL REFERENCES users(id),
        timestamp timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 21. Warehouses Table
      CREATE TABLE IF NOT EXISTS warehouses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        code varchar(50) NOT NULL UNIQUE,
        address text,
        city varchar(100),
        state varchar(100),
        country varchar(100) DEFAULT 'India' NOT NULL,
        postal_code varchar(20),
        contact_person varchar(100),
        contact_phone varchar(50),
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);

      -- 22. Warehouse Inventory Table
      CREATE TABLE IF NOT EXISTS warehouse_inventory (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity_on_hand integer DEFAULT 0 NOT NULL,
        quantity_reserved integer DEFAULT 0 NOT NULL,
        quantity_available integer DEFAULT 0 NOT NULL,
        reorder_point integer DEFAULT 10 NOT NULL,
        safety_stock integer DEFAULT 5 NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT uq_warehouse_product UNIQUE (warehouse_id, product_id)
      );

      -- 23. Inventory Transactions Table
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        warehouse_id uuid NOT NULL REFERENCES warehouses(id),
        product_id uuid NOT NULL REFERENCES products(id),
        transaction_type varchar(50) NOT NULL,
        quantity integer NOT NULL,
        reference_type varchar(50) NOT NULL,
        reference_id uuid NOT NULL,
        created_by_id uuid NOT NULL REFERENCES users(id),
        notes text,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 24. Fulfillments Table
      CREATE TABLE IF NOT EXISTS fulfillments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        fulfillment_number varchar(50) NOT NULL UNIQUE,
        quotation_id uuid NOT NULL REFERENCES quotations(id),
        status varchar(50) DEFAULT 'PENDING' NOT NULL,
        shipping_address text NOT NULL,
        carrier varchar(100),
        tracking_number varchar(100),
        shipped_at timestamp with time zone,
        delivered_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 25. Fulfillment Allocations Table
      CREATE TABLE IF NOT EXISTS fulfillment_allocations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        fulfillment_id uuid NOT NULL REFERENCES fulfillments(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id),
        warehouse_id uuid NOT NULL REFERENCES warehouses(id),
        quantity_allocated integer NOT NULL,
        status varchar(50) DEFAULT 'ALLOCATED' NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 26. Backorders Table
      CREATE TABLE IF NOT EXISTS backorders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_id uuid NOT NULL REFERENCES quotations(id),
        product_id uuid NOT NULL REFERENCES products(id),
        quantity integer NOT NULL,
        status varchar(50) DEFAULT 'OPEN' NOT NULL,
        expected_restock_date timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 27. Subscription Plans Table
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL UNIQUE,
        code varchar(50) NOT NULL UNIQUE,
        description text,
        billing_interval varchar(20) DEFAULT 'MONTHLY' NOT NULL,
        price numeric(12, 2) NOT NULL,
        currency varchar(10) DEFAULT 'INR' NOT NULL,
        features jsonb DEFAULT '[]'::jsonb NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 28. System Settings Table
      CREATE TABLE IF NOT EXISTS system_settings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name varchar(255) DEFAULT 'DealFlow360 Technologies Pvt Ltd' NOT NULL,
        support_email varchar(255) DEFAULT 'admin@dealflow360.com' NOT NULL,
        support_phone varchar(50) DEFAULT '+91 98765 43210',
        default_currency varchar(10) DEFAULT 'INR' NOT NULL,
        default_tax_rate numeric(5, 2) DEFAULT 18.00 NOT NULL,
        quote_expiration_days varchar(10) DEFAULT '30' NOT NULL,
        approval_threshold_percent numeric(5, 2) DEFAULT 10.00 NOT NULL,
        company_address text DEFAULT 'Level 7, Cyber Tower, Hi-Tech City, Hyderabad, India',
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      -- 29. Invoices Table
      CREATE TABLE IF NOT EXISTS invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number varchar(50) NOT NULL UNIQUE,
        quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
        customer_id uuid NOT NULL REFERENCES customers(id),
        order_number varchar(50),
        status varchar(50) DEFAULT 'ISSUED' NOT NULL,
        currency varchar(10) DEFAULT 'INR' NOT NULL,
        subtotal numeric(12, 2) DEFAULT '0.00' NOT NULL,
        discount_amount numeric(12, 2) DEFAULT '0.00' NOT NULL,
        tax_amount numeric(12, 2) DEFAULT '0.00' NOT NULL,
        total_amount numeric(12, 2) DEFAULT '0.00' NOT NULL,
        amount_paid numeric(12, 2) DEFAULT '0.00' NOT NULL,
        balance_due numeric(12, 2) DEFAULT '0.00' NOT NULL,
        issue_date date NOT NULL,
        due_date date NOT NULL,
        notes text,
        created_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_quotation_id ON invoices(quotation_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

      -- 30. Invoice Items Table
      CREATE TABLE IF NOT EXISTS invoice_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id),
        product_name_snapshot varchar(255) NOT NULL,
        sku_snapshot varchar(100) NOT NULL,
        quantity integer NOT NULL,
        unit_price numeric(12, 2) NOT NULL,
        discount_percent numeric(5, 2) DEFAULT '0.00' NOT NULL,
        gross_amount numeric(12, 2) NOT NULL,
        discount_amount numeric(12, 2) DEFAULT '0.00' NOT NULL,
        net_amount numeric(12, 2) NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

      -- 31. Payments Table
      CREATE TABLE IF NOT EXISTS payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_number varchar(50) NOT NULL UNIQUE,
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        customer_id uuid NOT NULL REFERENCES customers(id),
        amount numeric(12, 2) NOT NULL,
        currency varchar(10) DEFAULT 'INR' NOT NULL,
        payment_method varchar(50) NOT NULL,
        transaction_reference varchar(100) NOT NULL,
        status varchar(50) DEFAULT 'COMPLETED' NOT NULL,
        notes text,
        recorded_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
        paid_at timestamp with time zone DEFAULT now() NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

      -- 32. Credit Notes Table
      CREATE TABLE IF NOT EXISTS credit_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        credit_note_number varchar(50) NOT NULL UNIQUE,
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        customer_id uuid NOT NULL REFERENCES customers(id),
        amount numeric(12, 2) NOT NULL,
        currency varchar(10) DEFAULT 'INR' NOT NULL,
        reason text NOT NULL,
        status varchar(50) DEFAULT 'APPROVED' NOT NULL,
        approved_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_credit_notes_invoice_id ON credit_notes(invoice_id);
    `));
    console.log('✓ All 32 platform relational tables and constraints verified.');

    // 3. Bootstrap RBAC permissions & roles
    console.log('Bootstrapping enterprise RBAC permissions & roles...');
    await bootstrapRbac();
    console.log('✓ RBAC system initialized.');

    // 4. Seed Canonical Users for all 5 Roles
    console.log('Configuring default users for all 5 platform roles...');
    const allDbRoles = await db.select().from(roles);
    const roleMap = new Map(allDbRoles.map((r) => [r.name, r.id]));

    const defaultPasswordHash = await hashPassword('Password@123');

    const canonicalUsers = [
      {
        name: 'Platform Administrator',
        email: 'admin@dealflow360.io',
        role: Roles.ADMIN,
      },
      {
        name: 'Sales Representative',
        email: 'sales.rep@dealflow360.io',
        role: Roles.SALES_REP,
      },
      {
        name: 'Sales Manager',
        email: 'sales.manager@dealflow360.io',
        role: Roles.SALES_MANAGER,
      },
      {
        name: 'Finance Officer',
        email: 'finance@dealflow360.io',
        role: Roles.FINANCE,
      },
      {
        name: 'Customer Procurement',
        email: 'customer@dealflow360.io',
        role: Roles.CUSTOMER,
      },
    ];

    for (const u of canonicalUsers) {
      const roleId = roleMap.get(u.role);
      if (!roleId) continue;

      const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
      let userId: string;

      if (existing.length > 0) {
        userId = existing[0].id;
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

      await db
        .insert(userRoles)
        .values({
          userId,
          roleId,
        })
        .onConflictDoNothing();
    }
    console.log('✓ Canonical seed users configured (Password: Password@123).');

    // 5. Seed Default System Settings
    const existingSettings = await db.select().from(systemSettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(systemSettings).values({
        companyName: 'DealFlow360 Technologies Pvt Ltd',
        supportEmail: 'admin@dealflow360.com',
        supportPhone: '+91 98765 43210',
        defaultCurrency: 'INR',
        defaultTaxRate: '18.00',
        quoteExpirationDays: '30',
        approvalThresholdPercent: '10.00',
        companyAddress: 'Level 7, Cyber Tower, Hi-Tech City, Hyderabad, India',
      });
      console.log('✓ Seeded initial System Settings.');
    }

    // 6. Seed Customer Tiers
    const tiersToSeed = [
      { name: 'Platinum', description: 'Enterprise VIP Accounts ($100k+ ARR)', minAnnualSpend: '1000000.00', badgeColor: 'purple' },
      { name: 'Gold', description: 'Key Strategic Clients ($50k+ ARR)', minAnnualSpend: '500000.00', badgeColor: 'amber' },
      { name: 'Silver', description: 'Standard Commercial Customers', minAnnualSpend: '200000.00', badgeColor: 'blue' },
      { name: 'Bronze', description: 'Entry Tier & SMB Accounts', minAnnualSpend: '50000.00', badgeColor: 'slate' },
    ];
    for (const t of tiersToSeed) {
      await db.insert(customerTiers).values(t).onConflictDoNothing();
    }
    console.log('✓ Seeded Customer Tiers (Platinum, Gold, Silver, Bronze).');

    // 7. Seed Product Categories
    const categoriesToSeed = [
      { name: 'Enterprise Software', description: 'Core application licenses and seats' },
      { name: 'Hardware Solutions', description: 'Data center servers, networking hardware and appliances' },
      { name: 'Professional Services', description: 'Consulting, implementation, onboarding, SLA support' },
      { name: 'Cloud Subscriptions', description: 'Recurring SaaS compute and storage tiers' },
    ];
    for (const c of categoriesToSeed) {
      await db.insert(productCategories).values(c).onConflictDoNothing();
    }
    console.log('✓ Seeded Product Categories.');

    // 8. Seed Warehouses
    const warehousesToSeed = [
      { name: 'Main Distribution Hub', code: 'WH-MUM-01', city: 'Mumbai', state: 'Maharashtra', address: 'Plot 42, MIDC Industrial Area, Andheri East' },
      { name: 'North Logistics Center', code: 'WH-DEL-02', city: 'Delhi', state: 'Delhi NCR', address: 'Block C, Okhla Phase II' },
      { name: 'South Tech Hub', code: 'WH-BLR-03', city: 'Bengaluru', state: 'Karnataka', address: 'Electronic City Phase 1' },
    ];
    for (const w of warehousesToSeed) {
      await db.insert(warehouses).values(w).onConflictDoNothing();
    }
    console.log('✓ Seeded Logistics Warehouses.');

    // 9. Seed Catalog Products
    const allCategories = await db.select().from(productCategories);
    const catMap = new Map(allCategories.map((c) => [c.name, c.id]));
    const swCatId = catMap.get('Enterprise Software') || allCategories[0]?.id;
    const hwCatId = catMap.get('Hardware Solutions') || allCategories[0]?.id;
    const srvCatId = catMap.get('Professional Services') || allCategories[0]?.id;

    if (swCatId && hwCatId && srvCatId) {
      const sampleProducts = [
        { name: 'DealFlow360 Enterprise License (Annual)', sku: 'DF360-ENT-YR', categoryId: swCatId, productType: 'SUBSCRIPTION', basePrice: '150000.00', stock: 999 },
        { name: 'High-Performance Edge Server X8', sku: 'SRV-EDGE-X8', categoryId: hwCatId, productType: 'PHYSICAL', basePrice: '450000.00', stock: 45 },
        { name: '24/7 Dedicated Support & SLA Package', sku: 'SLA-PREM-247', categoryId: srvCatId, productType: 'SERVICE', basePrice: '75000.00', stock: 100 },
        { name: 'Security Audit & Compliance Pack', sku: 'SEC-AUDIT-PKG', categoryId: srvCatId, productType: 'SERVICE', basePrice: '120000.00', stock: 50 },
      ];
      for (const p of sampleProducts) {
        await db.insert(products).values(p).onConflictDoNothing();
      }
      console.log('✓ Seeded Demo Catalog Products.');
    }

    // 10. Seed Demo Customer Account
    const platinumTier = await db.select().from(customerTiers).where(eq(customerTiers.name, 'Platinum')).limit(1);
    const tierId = platinumTier[0]?.id;
    if (tierId) {
      const defaultCustomer = {
        companyName: 'Acme Corporation Global',
        contactName: 'John Doe',
        email: 'customer@dealflow360.io',
        phone: '+91 98111 22233',
        customerTierId: tierId,
        status: 'ACTIVE',
      };
      await db.insert(customers).values(defaultCustomer).onConflictDoNothing();
      console.log('✓ Seeded Demo Customer Profile linked to customer@dealflow360.io.');
    }

    // 11. Seed Subscription Plans
    const plansToSeed = [
      {
        name: 'Starter Tier',
        code: 'PLAN-STARTER',
        description: 'Ideal for small sales teams (up to 5 reps)',
        billingInterval: 'MONTHLY',
        price: '4999.00',
        features: ['Up to 5 Sales Reps', '100 Quotes / Month', 'Basic Analytics', 'Email Support'],
      },
      {
        name: 'Growth Enterprise',
        code: 'PLAN-GROWTH',
        description: 'For scaling B2B teams with margin governance',
        billingInterval: 'MONTHLY',
        price: '14999.00',
        features: ['Unlimited Reps', 'Multi-Tier Approvals', 'Revenue Analytics', 'AI Upsell Engine', 'Dedicated Support'],
      },
      {
        name: 'Annual Scale',
        code: 'PLAN-ANNUAL',
        description: 'Complete commercial operations suite billed annually',
        billingInterval: 'YEARLY',
        price: '149999.00',
        features: ['All Growth Features', 'Custom Invoicing & AR Aging', 'Full Logistics & Backorders', 'Custom Integrations', '99.9% SLA'],
      },
    ];
    for (const pl of plansToSeed) {
      await db.insert(subscriptionPlans).values(pl).onConflictDoNothing();
    }
    console.log('✓ Seeded Subscription Plans.');

    console.log('================================================================');
    console.log('🎉 DEALFLOW360 FRESH DATABASE INITIALIZATION COMPLETED (100%)');
    console.log('================================================================');
    console.log('Database is completely initialized and ready for production or testing.');
    console.log('Login credentials:');
    console.log('  • Admin:        admin@dealflow360.io          / Password@123');
    console.log('  • Sales Rep:    sales.rep@dealflow360.io      / Password@123');
    console.log('  • Manager:      sales.manager@dealflow360.io  / Password@123');
    console.log('  • Finance:      finance@dealflow360.io        / Password@123');
    console.log('  • Customer:     customer@dealflow360.io       / Password@123');
    console.log('================================================================');
  } catch (error) {
    console.error('❌ Error during fresh database setup:', error);
    process.exit(1);
  }
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith('setupFreshDb.ts') || process.argv[1]?.endsWith('setupFreshDb.js')) {
  setupFreshDatabase().then(() => {
    pool.end();
  });
}
