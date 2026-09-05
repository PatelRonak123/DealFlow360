import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pool } from './db.js';

async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...');
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database migrations completed successfully.');
  } catch (error) {
    console.error('Error executing database migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };
