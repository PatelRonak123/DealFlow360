import { createApp } from './app.js';
import { appConfig } from './config/app.js';
import { pool } from './database/db.js';

const app = createApp();

const server = app.listen(appConfig.port, async () => {
  console.log(`[DealFlow360 API] Server is running on http://${appConfig.host}:${appConfig.port}`);
  console.log(`[DealFlow360 API] Health check at http://${appConfig.host}:${appConfig.port}/health`);
  console.log(`[DealFlow360 API] API prefix: ${appConfig.apiPrefix}`);

  // Warm up database connection pool asynchronously to eliminate cold-start TLS handshake latency
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[DealFlow360 API] Database connection pool initialized & warm.');

    // Initialize admin tables if missing
    const { initAdminTables } = await import('./database/initAdminTables.js');
    await initAdminTables();
  } catch (err) {
    console.warn('[DealFlow360 API] Database pool pre-warm check:', err);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
