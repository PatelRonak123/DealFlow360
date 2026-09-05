import { env } from './env.js';

const isSslRequired =
  env.NODE_ENV === 'production' ||
  env.DATABASE_URL.includes('supabase.com') ||
  env.DATABASE_URL.includes('sslmode=require') ||
  process.env.DB_SSL === 'true';

export const databaseConfig = {
  url: env.DATABASE_URL,
  maxConnections: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
} as const;
