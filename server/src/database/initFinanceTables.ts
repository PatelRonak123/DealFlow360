import { db } from './db.js';
import { sql } from 'drizzle-orm';

export async function initFinanceTables(): Promise<void> {
  try {
    await db.execute(sql.raw(`
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
      CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

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
      CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);

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
      CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

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
      CREATE INDEX IF NOT EXISTS idx_credit_notes_customer_id ON credit_notes(customer_id);
      CREATE INDEX IF NOT EXISTS idx_credit_notes_status ON credit_notes(status);
    `));

    console.log('[DB Init] Finance tables initialized successfully.');
  } catch (err) {
    console.warn('[DB Init] Finance tables initialization note:', (err as Error).message);
  }
}
