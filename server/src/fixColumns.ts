import { pool } from './database/db.js';

async function fix() {
  const client = await pool.connect();
  try {
    console.log('Renaming productId to product_id if needed...');
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'warehouse_inventory' AND column_name = 'productId'
        ) THEN
          ALTER TABLE "warehouse_inventory" RENAME COLUMN "productId" TO "product_id";
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'inventory_transactions' AND column_name = 'productId'
        ) THEN
          ALTER TABLE "inventory_transactions" RENAME COLUMN "productId" TO "product_id";
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          
          WHERE table_name = 'fulfillment_allocations' AND column_name = 'productId'
        ) THEN
          ALTER TABLE "fulfillment_allocations" RENAME COLUMN "productId" TO "product_id";
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'backorders' AND column_name = 'productId'
        ) THEN
          ALTER TABLE "backorders" RENAME COLUMN "productId" TO "product_id";
        END IF;
      END $$;
    `);
    console.log('Columns renamed successfully to standard snake_case (product_id).');
  } finally {
    client.release();
    await pool.end();
  }
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
