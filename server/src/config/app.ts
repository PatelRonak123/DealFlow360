import { env } from './env.js';

export const appConfig = {
  name: 'DealFlow360 API',
  version: '1.0.0',
  port: env.PORT,
  host: env.HOST,
  env: env.NODE_ENV,
  apiPrefix: '/api/v1',
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
} as const;
