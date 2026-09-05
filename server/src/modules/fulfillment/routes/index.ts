import { Router } from 'express';
import { fulfillmentController } from '../controllers/fulfillment.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermission(Permissions.FULFILLMENT_READ),
  fulfillmentController.list.bind(fulfillmentController)
);

router.get(
  '/quotations/:quotationId/preview',
  requirePermission(Permissions.FULFILLMENT_READ),
  fulfillmentController.previewAllocation.bind(fulfillmentController)
);

router.get(
  '/quotations/:quotationId',
  requirePermission(Permissions.FULFILLMENT_READ),
  fulfillmentController.getByQuotationId.bind(fulfillmentController)
);

router.get(
  '/:id',
  requirePermission(Permissions.FULFILLMENT_READ),
  fulfillmentController.getById.bind(fulfillmentController)
);

router.post(
  '/',
  requirePermission(Permissions.FULFILLMENT_CREATE),
  fulfillmentController.create.bind(fulfillmentController)
);

router.put(
  '/:id/allocations',
  requirePermission(Permissions.FULFILLMENT_UPDATE),
  fulfillmentController.overrideAllocations.bind(fulfillmentController)
);

router.post(
  '/:id/fulfill',
  requirePermission(Permissions.FULFILLMENT_COMPLETE),
  fulfillmentController.fulfill.bind(fulfillmentController)
);

router.post(
  '/:id/cancel',
  requirePermission(Permissions.FULFILLMENT_CANCEL),
  fulfillmentController.cancel.bind(fulfillmentController)
);

export default router;
