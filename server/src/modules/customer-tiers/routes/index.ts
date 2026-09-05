import { Router } from 'express';
import { customerTiersController } from '../controllers/customerTiers.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const customerTiersRouter = Router();

// All customer tier endpoints require authentication
customerTiersRouter.use(requireAuth);

customerTiersRouter.get(
  '/',
  requirePermission(Permissions.CUSTOMER_TIER_READ),
  (req, res, next) => customerTiersController.list(req, res, next)
);

customerTiersRouter.get(
  '/:id',
  requirePermission(Permissions.CUSTOMER_TIER_READ),
  (req, res, next) => customerTiersController.getById(req, res, next)
);

customerTiersRouter.post(
  '/',
  requirePermission(Permissions.CUSTOMER_TIER_MANAGE),
  (req, res, next) => customerTiersController.create(req, res, next)
);

customerTiersRouter.patch(
  '/:id',
  requirePermission(Permissions.CUSTOMER_TIER_MANAGE),
  (req, res, next) => customerTiersController.update(req, res, next)
);

customerTiersRouter.delete(
  '/:id',
  requirePermission(Permissions.CUSTOMER_TIER_MANAGE),
  (req, res, next) => customerTiersController.delete(req, res, next)
);
