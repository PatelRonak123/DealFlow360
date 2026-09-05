import { Router } from 'express';
import { warehousesController } from '../controllers/warehouses.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const warehousesRouter = Router();
warehousesRouter.use(requireAuth);

warehousesRouter.post(
  '/',
  requirePermission(Permissions.WAREHOUSE_MANAGE),
  (req, res, next) => warehousesController.create(req, res, next)
);

warehousesRouter.get(
  '/',
  requirePermission(Permissions.WAREHOUSE_READ),
  (req, res, next) => warehousesController.list(req, res, next)
);

warehousesRouter.get(
  '/:id',
  requirePermission(Permissions.WAREHOUSE_READ),
  (req, res, next) => warehousesController.getById(req, res, next)
);

warehousesRouter.patch(
  '/:id',
  requirePermission(Permissions.WAREHOUSE_MANAGE),
  (req, res, next) => warehousesController.update(req, res, next)
);

warehousesRouter.delete(
  '/:id',
  requirePermission(Permissions.WAREHOUSE_MANAGE),
  (req, res, next) => warehousesController.delete(req, res, next)
);
