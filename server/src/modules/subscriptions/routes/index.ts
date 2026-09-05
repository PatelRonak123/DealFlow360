import { Router } from 'express';
import { subscriptionsController } from '../controllers/subscriptions.controller.js';
import { subscriptionPlansController } from '../controllers/subscriptionPlans.controller.js';
import { requireAuth, requireRole, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Roles } from '../../rbac/constants/roles.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const subscriptionsRouter = Router();

// Subscriptions management (for commercial subscriptions lifecycle)
subscriptionsRouter.get(
  '/',
  requireAuth,
  requireRole(Roles.SALES_MANAGER, Roles.FINANCE, Roles.ADMIN, Roles.SALES_REP),
  subscriptionsController.list.bind(subscriptionsController)
);
subscriptionsRouter.get(
  '/:id',
  requireAuth,
  requireRole(Roles.SALES_MANAGER, Roles.FINANCE, Roles.ADMIN, Roles.SALES_REP),
  subscriptionsController.getById.bind(subscriptionsController)
);
subscriptionsRouter.post(
  '/:id/renew',
  requireAuth,
  requireRole(Roles.SALES_MANAGER, Roles.FINANCE, Roles.ADMIN),
  subscriptionsController.renew.bind(subscriptionsController)
);
subscriptionsRouter.post(
  '/:id/cancel',
  requireAuth,
  requireRole(Roles.SALES_MANAGER, Roles.FINANCE, Roles.ADMIN),
  subscriptionsController.cancel.bind(subscriptionsController)
);

// Subscription Plans Endpoints (nested under /api/v1/subscriptions/plans)
subscriptionsRouter.get(
  '/plans',
  requireAuth,
  requirePermission(Permissions.BILLING_READ),
  (req, res, next) => subscriptionPlansController.list(req, res, next)
);

subscriptionsRouter.get(
  '/plans/:id',
  requireAuth,
  requirePermission(Permissions.BILLING_READ),
  (req, res, next) => subscriptionPlansController.getById(req, res, next)
);

subscriptionsRouter.post(
  '/plans',
  requireAuth,
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => subscriptionPlansController.create(req, res, next)
);

subscriptionsRouter.patch(
  '/plans/:id',
  requireAuth,
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => subscriptionPlansController.update(req, res, next)
);

subscriptionsRouter.delete(
  '/plans/:id',
  requireAuth,
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => subscriptionPlansController.delete(req, res, next)
);

// Dedicated router for direct /api/v1/subscription-plans mounting
export const subscriptionPlansRouter = Router();
subscriptionPlansRouter.use(requireAuth);

subscriptionPlansRouter.get(
  '/',
  requirePermission(Permissions.BILLING_READ),
  (req, res, next) => subscriptionPlansController.list(req, res, next)
);

subscriptionPlansRouter.get(
  '/:id',
  requirePermission(Permissions.BILLING_READ),
  (req, res, next) => subscriptionPlansController.getById(req, res, next)
);

subscriptionPlansRouter.post(
  '/',
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => subscriptionPlansController.create(req, res, next)
);

subscriptionPlansRouter.patch(
  '/:id',
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => subscriptionPlansController.update(req, res, next)
);

subscriptionPlansRouter.delete(
  '/:id',
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => subscriptionPlansController.delete(req, res, next)
);
