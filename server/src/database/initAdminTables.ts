import { db } from './db.js';
import { sql } from 'drizzle-orm';

export async function initAdminTables(): Promise<void> {
  try {
    await db.execute(sql.raw(`
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
    `));
  } catch (err) {
    console.warn('[DB Init] Admin tables initialization note:', (err as Error).message);
  }
}
