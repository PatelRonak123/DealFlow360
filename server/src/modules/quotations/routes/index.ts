import { Router } from 'express';
import { quotationsController } from '../controllers/quotations.controller.js';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';
import { DiscountGovernanceController } from '../../discount-governance/controllers/discountGovernance.controller.js';
import { quotationRecommendationsRouter } from '../../recommendations/routes/index.js';

const governanceController = new DiscountGovernanceController();

export const quotationsRouter = Router();

// All quotation endpoints require authentication
quotationsRouter.use(requireAuth);

// Header CRUD
quotationsRouter.get(
  '/',
  requirePermission(Permissions.QUOTATION_READ),
  (req, res, next) => quotationsController.list(req, res, next)
);

quotationsRouter.get(
  '/:id',
  requirePermission(Permissions.QUOTATION_READ),
  (req, res, next) => quotationsController.getById(req, res, next)
);

quotationsRouter.post(
  '/',
  requirePermission(Permissions.QUOTATION_CREATE),
  (req, res, next) => quotationsController.create(req, res, next)
);

quotationsRouter.patch(
  '/:id',
  requirePermission(Permissions.QUOTATION_UPDATE),
  (req, res, next) => quotationsController.update(req, res, next)
);

quotationsRouter.delete(
  '/:id',
  requirePermission(Permissions.QUOTATION_DELETE),
  (req, res, next) => quotationsController.cancel(req, res, next)
);

// Discount Governance & Workflow Actions
quotationsRouter.post(
  '/:id/submit',
  requirePermission(Permissions.QUOTATION_SUBMIT),
  (req, res, next) => governanceController.submitQuotation(req, res, next)
);

quotationsRouter.post(
  '/:id/evaluate-discount',
  requirePermission(Permissions.QUOTATION_EVALUATE),
  (req, res, next) => governanceController.evaluateDiscount(req, res, next)
);

quotationsRouter.get(
  '/:id/discount-evaluation',
  requirePermission(Permissions.QUOTATION_READ),
  (req, res, next) => governanceController.getDiscountEvaluation(req, res, next)
);

quotationsRouter.get(
  '/:id/approvals',
  requirePermission(Permissions.QUOTATION_READ),
  (req, res, next) => governanceController.getQuotationApprovals(req, res, next)
);

// Recommendations Sub-router (/api/v1/quotations/:quotationId/recommendations)
quotationsRouter.use('/:quotationId/recommendations', quotationRecommendationsRouter);

// Line items CRUD
quotationsRouter.post(
  '/:quotationId/items',
  requirePermission(Permissions.QUOTATION_UPDATE),
  (req, res, next) => quotationsController.addItem(req, res, next)
);

quotationsRouter.patch(
  '/:quotationId/items/:itemId',
  requirePermission(Permissions.QUOTATION_UPDATE),
  (req, res, next) => quotationsController.updateItem(req, res, next)
);

quotationsRouter.delete(
  '/:quotationId/items/:itemId',
  requirePermission(Permissions.QUOTATION_UPDATE),
  (req, res, next) => quotationsController.deleteItem(req, res, next)
);
