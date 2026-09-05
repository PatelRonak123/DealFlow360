import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { databaseConfig } from '../config/database.js';
import * as schema from './schema/index.js';
import * as relations from './relations/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: databaseConfig.url,
  max: databaseConfig.maxConnections,
  idleTimeoutMillis: databaseConfig.idleTimeoutMillis,
  connectionTimeoutMillis: databaseConfig.connectionTimeoutMillis,
  ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, {
  schema: { ...schema, ...relations },
});

export type Database = typeof db;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbClient = Database | Transaction;
