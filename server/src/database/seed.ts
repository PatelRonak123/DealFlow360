import { bootstrapRbac } from '../modules/rbac/index.js';
import { pool } from './db.js';

async function seedDatabase(): Promise<void> {
  console.log('Starting system initialization & RBAC bootstrap...');
  try {
    await bootstrapRbac();
    console.log('System initialization completed successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase };
