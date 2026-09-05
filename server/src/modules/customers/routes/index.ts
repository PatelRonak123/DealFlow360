import { Router } from 'express';
import { customersController } from '../controllers/customers.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const customersRouter = Router();

// All customers endpoints require authentication
customersRouter.use(requireAuth);

customersRouter.get(
  '/',
  requirePermission(Permissions.CUSTOMER_READ),
  (req, res, next) => customersController.list(req, res, next)
);

customersRouter.get(
  '/:id',
  requirePermission(Permissions.CUSTOMER_READ),
  (req, res, next) => customersController.getById(req, res, next)
);

customersRouter.post(
  '/',
  requirePermission(Permissions.CUSTOMER_MANAGE),
  (req, res, next) => customersController.create(req, res, next)
);

customersRouter.patch(
  '/:id',
  requirePermission(Permissions.CUSTOMER_MANAGE),
  (req, res, next) => customersController.update(req, res, next)
);

customersRouter.patch(
  '/:id/status',
  requirePermission(Permissions.CUSTOMER_MANAGE),
  (req, res, next) => customersController.updateStatus(req, res, next)
);

customersRouter.delete(
  '/:id',
  requirePermission(Permissions.CUSTOMER_MANAGE),
  (req, res, next) => customersController.delete(req, res, next)
);
