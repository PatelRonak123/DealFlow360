import { Router } from 'express';
import { priceListsController } from '../controllers/priceLists.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const priceListsRouter = Router();

// All price list endpoints require authentication
priceListsRouter.use(requireAuth);

// Price list CRUD
priceListsRouter.get(
  '/',
  requirePermission(Permissions.PRICE_LIST_READ),
  (req, res, next) => priceListsController.list(req, res, next)
);

priceListsRouter.get(
  '/:id',
  requirePermission(Permissions.PRICE_LIST_READ),
  (req, res, next) => priceListsController.getById(req, res, next)
);

priceListsRouter.post(
  '/',
  requirePermission(Permissions.PRICE_LIST_MANAGE),
  (req, res, next) => priceListsController.create(req, res, next)
);

priceListsRouter.patch(
  '/:id',
  requirePermission(Permissions.PRICE_LIST_MANAGE),
  (req, res, next) => priceListsController.update(req, res, next)
);

priceListsRouter.delete(
  '/:id',
  requirePermission(Permissions.PRICE_LIST_MANAGE),
  (req, res, next) => priceListsController.delete(req, res, next)
);

// Price list items CRUD
priceListsRouter.get(
  '/:priceListId/items',
  requirePermission(Permissions.PRICE_LIST_READ),
  (req, res, next) => priceListsController.listItems(req, res, next)
);

priceListsRouter.post(
  '/:priceListId/items',
  requirePermission(Permissions.PRICE_LIST_MANAGE),
  (req, res, next) => priceListsController.addItem(req, res, next)
);

priceListsRouter.patch(
  '/:priceListId/items/:itemId',
  requirePermission(Permissions.PRICE_LIST_MANAGE),
  (req, res, next) => priceListsController.updateItem(req, res, next)
);

priceListsRouter.delete(
  '/:priceListId/items/:itemId',
  requirePermission(Permissions.PRICE_LIST_MANAGE),
  (req, res, next) => priceListsController.deleteItem(req, res, next)
);
