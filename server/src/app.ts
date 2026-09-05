import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { appConfig } from './config/app.js';
import { requestLogger, errorHandler, notFoundHandler } from './common/middleware/index.js';
import { sendSuccess } from './common/utils/index.js';

// Domain module routers
import { authRouter } from './modules/auth/index.js';
import { usersRouter } from './modules/users/index.js';
import { customerTiersRouter } from './modules/customer-tiers/index.js';
import { categoriesRouter } from './modules/categories/index.js';
import { customersRouter } from './modules/customers/index.js';
import { productsRouter } from './modules/products/index.js';
import { pricingRouter } from './modules/pricing/index.js';
import { discountGovernanceRouter } from './modules/discount-governance/index.js';
import { quotationsRouter } from './modules/quotations/index.js';
import { approvalsRouter } from './modules/approvals/index.js';
import { upsellCrossSellRouter } from './modules/upsell-cross-sell/index.js';
import { inventoryRouter } from './modules/inventory/index.js';
import { warehousesRouter } from './modules/warehouses/index.js';
import { fulfillmentRouter } from './modules/fulfillment/index.js';
import { subscriptionsRouter } from './modules/subscriptions/index.js';
import { billingRouter } from './modules/billing/index.js';
import { paymentsRouter } from './modules/payments/index.js';
import { customerPortalRouter } from './modules/customer-portal/index.js';
import { dealHealthRouter } from './modules/deal-health/index.js';
import { notificationsRouter } from './modules/notifications/index.js';
import { auditLogsRouter } from './modules/audit-logs/index.js';
import { reportsRouter } from './modules/reports/index.js';

export function createApp(): Express {
  const app = express();

  // 1. Security & Basic Middleware
  app.use(helmet());

  // 2. CORS
  app.use(cors(appConfig.cors));

  // 3. Body Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 4. Request Logging
  app.use(requestLogger);

  // 5. Health Check Endpoint (Mounted under root /health and /api/v1/health)
  const healthHandler = (_req: Request, res: Response) => {
    sendSuccess(
      res,
      {
        status: 'healthy',
        service: appConfig.name,
        version: appConfig.version,
      },
      'DealFlow360 API is running'
    );
  };

  app.get('/health', healthHandler);
  app.get(`${appConfig.apiPrefix}/health`, healthHandler);

  // 6. Mount Domain Module API Routers under /api/v1
  const prefix = appConfig.apiPrefix;
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/users`, usersRouter);
  app.use(`${prefix}/customer-tiers`, customerTiersRouter);
  app.use(`${prefix}/categories`, categoriesRouter);
  app.use(`${prefix}/customers`, customersRouter);
  app.use(`${prefix}/products`, productsRouter);
  app.use(`${prefix}/pricing`, pricingRouter);
  app.use(`${prefix}/discount-governance`, discountGovernanceRouter);
  app.use(`${prefix}/quotations`, quotationsRouter);
  app.use(`${prefix}/approvals`, approvalsRouter);
  app.use(`${prefix}/upsell-cross-sell`, upsellCrossSellRouter);
  app.use(`${prefix}/inventory`, inventoryRouter);
  app.use(`${prefix}/warehouses`, warehousesRouter);
  app.use(`${prefix}/fulfillment`, fulfillmentRouter);
  app.use(`${prefix}/subscriptions`, subscriptionsRouter);
  app.use(`${prefix}/billing`, billingRouter);
  app.use(`${prefix}/payments`, paymentsRouter);
  app.use(`${prefix}/customer-portal`, customerPortalRouter);
  app.use(`${prefix}/deal-health`, dealHealthRouter);
  app.use(`${prefix}/notifications`, notificationsRouter);
  app.use(`${prefix}/audit-logs`, auditLogsRouter);
  app.use(`${prefix}/reports`, reportsRouter);

  // 7. 404 Route Catch-all
  app.use(notFoundHandler);

  // 8. Global Error Handler (Registered last)
  app.use(errorHandler);

  return app;
}
