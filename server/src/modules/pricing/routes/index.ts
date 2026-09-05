import { Router } from 'express';
import { pricingController } from '../controllers/pricing.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';

export const pricingRouter = Router();

// Protected pricing resolution endpoint
pricingRouter.use(requireAuth);

pricingRouter.get(
  '/resolve',
  requirePermission(Permissions.PRICE_LIST_READ),
  (req, res, next) => pricingController.resolvePrice(req, res, next)
);
