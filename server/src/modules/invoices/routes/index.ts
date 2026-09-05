import { Router } from 'express';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';
import { invoicesController } from '../controllers/invoices.controller.js';

export const invoicesRouter = Router();

invoicesRouter.use(requireAuth);

invoicesRouter.get(
  '/',
  requirePermission(Permissions.BILLING_READ),
  (req, res, next) => invoicesController.listInvoices(req, res, next)
);

invoicesRouter.get(
  '/:id',
  requirePermission(Permissions.BILLING_READ),
  (req, res, next) => invoicesController.getInvoiceById(req, res, next)
);

invoicesRouter.post(
  '/',
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => invoicesController.createManualInvoice(req, res, next)
);

invoicesRouter.post(
  '/generate-from-quotation',
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => invoicesController.generateFromQuotation(req, res, next)
);

invoicesRouter.patch(
  '/:id/status',
  requirePermission(Permissions.BILLING_MANAGE),
  (req, res, next) => invoicesController.updateStatus(req, res, next)
);
