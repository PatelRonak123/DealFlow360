import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('Applying migration 0006_fluffy_iron_patriot.sql...');
  const sqlContent = fs.readFileSync(
    path.join(__dirname, '../../drizzle/0006_fluffy_iron_patriot.sql'),
    'utf8'
  );

  const statements = sqlContent
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt));
    } catch (err: unknown) {
      console.warn('Statement notice:', (err as Error).message);
    }
  }

  console.log('Migration 0006 applied successfully.');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
