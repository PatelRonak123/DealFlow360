import { createApp } from './app.js';
import { appConfig } from './config/app.js';

const app = createApp();

const server = app.listen(appConfig.port, () => {
  console.log(`[DealFlow360 API] Server is running on http://${appConfig.host}:${appConfig.port}`);
  console.log(`[DealFlow360 API] Health check at http://${appConfig.host}:${appConfig.port}/health`);
  console.log(`[DealFlow360 API] API prefix: ${appConfig.apiPrefix}`);
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
