import { Router } from 'express';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';
import { paymentsController } from '../controllers/payments.controller.js';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

paymentsRouter.get(
  '/',
  requirePermission(Permissions.BILLING_READ),
  (req, res, next) => paymentsController.listPayments(req, res, next)
);

paymentsRouter.get(
  '/:id',
  requirePermission(Permissions.BILLING_READ),
  (req, res, next) => paymentsController.getPaymentById(req, res, next)
);

paymentsRouter.post(
  '/',
  requirePermission(Permissions.PAYMENT_PROCESS),
  (req, res, next) => paymentsController.recordPayment(req, res, next)
);
