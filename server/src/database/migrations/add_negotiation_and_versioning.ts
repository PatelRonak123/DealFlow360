import { pool } from '../db.js';

export async function runMigration(): Promise<void> {
  console.log('Running migration: add_negotiation_and_versioning...');

  try {
    await pool.query(`
      -- Add versioning and visibility fields to quotations
      ALTER TABLE quotations ADD COLUMN IF NOT EXISTS parent_quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL;
      ALTER TABLE quotations ADD COLUMN IF NOT EXISTS version_number integer DEFAULT 1 NOT NULL;
      ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_customer_visible boolean DEFAULT false NOT NULL;
      ALTER TABLE quotations ADD COLUMN IF NOT EXISTS revision_reason text;
      ALTER TABLE quotations ADD COLUMN IF NOT EXISTS negotiation_id uuid;

      -- Backfill existing quotations so they are customer-visible if they are original
      UPDATE quotations 
      SET is_customer_visible = true 
      WHERE is_customer_visible = false AND parent_quotation_id IS NULL;

      -- Create quotation_negotiations table
      CREATE TABLE IF NOT EXISTS quotation_negotiations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        quotation_version_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
        customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        requested_discount_percent numeric(5, 2) NOT NULL,
        requested_changes text,
        customer_message text,
        status varchar(50) DEFAULT 'REQUESTED' NOT NULL,
        rep_response text,
        revised_quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
        handled_by uuid REFERENCES users(id) ON DELETE SET NULL,
        handled_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_quotation_negotiations_quotation_id ON quotation_negotiations(quotation_id);
      CREATE INDEX IF NOT EXISTS idx_quotation_negotiations_customer_id ON quotation_negotiations(customer_id);
      CREATE INDEX IF NOT EXISTS idx_quotation_negotiations_status ON quotation_negotiations(status);
    `);

    console.log('✓ Migration add_negotiation_and_versioning applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('add_negotiation_and_versioning.ts') || process.argv[1]?.endsWith('add_negotiation_and_versioning.js')) {
  runMigration()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
