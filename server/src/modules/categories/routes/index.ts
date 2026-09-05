import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const categoriesRouter = Router();

// All categories endpoints require authentication
categoriesRouter.use(requireAuth);

categoriesRouter.get(
  '/',
  requirePermission(Permissions.CATEGORY_READ),
  (req, res, next) => categoriesController.list(req, res, next)
);

categoriesRouter.get(
  '/:id',
  requirePermission(Permissions.CATEGORY_READ),
  (req, res, next) => categoriesController.getById(req, res, next)
);

categoriesRouter.post(
  '/',
  requirePermission(Permissions.CATEGORY_MANAGE),
  (req, res, next) => categoriesController.create(req, res, next)
);

categoriesRouter.patch(
  '/:id',
  requirePermission(Permissions.CATEGORY_MANAGE),
  (req, res, next) => categoriesController.update(req, res, next)
);

categoriesRouter.delete(
  '/:id',
  requirePermission(Permissions.CATEGORY_MANAGE),
  (req, res, next) => categoriesController.delete(req, res, next)
);
