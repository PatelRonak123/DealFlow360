import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermission(Permissions.INVENTORY_READ),
  inventoryController.list.bind(inventoryController)
);

router.get(
  '/transactions',
  requirePermission(Permissions.INVENTORY_READ),
  inventoryController.listTransactions.bind(inventoryController)
);

router.get(
  '/products/:productId/summary',
  requirePermission(Permissions.INVENTORY_READ),
  inventoryController.getProductSummary.bind(inventoryController)
);

router.post(
  '/adjust',
  requirePermission(Permissions.INVENTORY_ADJUST),
  inventoryController.adjustStock.bind(inventoryController)
);

router.post(
  '/set',
  requirePermission(Permissions.INVENTORY_MANAGE),
  inventoryController.setStock.bind(inventoryController)
);

export default router;
