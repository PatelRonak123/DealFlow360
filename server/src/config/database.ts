import { env } from './env.js';

const isSslRequired =
  env.NODE_ENV === 'production' ||
  env.DATABASE_URL.includes('supabase.com') ||
  env.DATABASE_URL.includes('sslmode=require') ||
  process.env.DB_SSL === 'true';

export const databaseConfig = {
  url: env.DATABASE_URL,
  maxConnections: 15,
  minConnections: 2,
  idleTimeoutMillis: 120000,
  connectionTimeoutMillis: 15000,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
} as const;
