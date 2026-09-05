import { env } from './env.js';

export const databaseConfig = {
  url: env.DATABASE_URL,
  maxConnections: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: env.NODE_ENV === 'production',
} as const;
