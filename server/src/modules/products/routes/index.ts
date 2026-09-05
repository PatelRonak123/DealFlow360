import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const productsRouter = Router();

// All products endpoints require authentication
productsRouter.use(requireAuth);

productsRouter.get(
  '/',
  requirePermission(Permissions.PRODUCT_READ),
  (req, res, next) => productsController.list(req, res, next)
);

productsRouter.get(
  '/:id',
  requirePermission(Permissions.PRODUCT_READ),
  (req, res, next) => productsController.getById(req, res, next)
);

productsRouter.post(
  '/',
  requirePermission(Permissions.PRODUCT_MANAGE),
  (req, res, next) => productsController.create(req, res, next)
);

productsRouter.patch(
  '/:id',
  requirePermission(Permissions.PRODUCT_MANAGE),
  (req, res, next) => productsController.update(req, res, next)
);

productsRouter.delete(
  '/:id',
  requirePermission(Permissions.PRODUCT_MANAGE),
  (req, res, next) => productsController.delete(req, res, next)
);
