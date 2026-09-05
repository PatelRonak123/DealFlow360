import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pool } from './db.js';
import { bootstrapRbac } from '../modules/rbac/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...');
  try {
    const db = drizzle(pool);
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    await migrate(db, { migrationsFolder });
    console.log('Database migrations completed successfully.');

    // Run idempotent RBAC bootstrap
    await bootstrapRbac();
  } catch (error) {
    console.error('Error executing database migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Allow direct execution
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  runMigrations();
}

export { runMigrations };
