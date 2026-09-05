import { Router } from 'express';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';
import { DiscountGovernanceController } from '../controllers/discountGovernance.controller.js';

const controller = new DiscountGovernanceController();

export const discountGovernanceRouter = Router();

discountGovernanceRouter.use(requireAuth);

discountGovernanceRouter.get(
  '/pending',
  requirePermission(Permissions.APPROVAL_READ),
  (req, res, next) => controller.listPendingApprovals(req, res, next)
);

discountGovernanceRouter.post(
  '/approvals/:id/approve',
  requirePermission(Permissions.APPROVAL_APPROVE),
  (req, res, next) => controller.approveApproval(req, res, next)
);

discountGovernanceRouter.post(
  '/approvals/:id/reject',
  requirePermission(Permissions.APPROVAL_REJECT),
  (req, res, next) => controller.rejectApproval(req, res, next)
);

export const quotationGovernanceRouter = Router();

quotationGovernanceRouter.post(
  '/:id/submit',
  requireAuth,
  requirePermission(Permissions.QUOTATION_SUBMIT),
  (req, res, next) => controller.submitQuotation(req, res, next)
);

quotationGovernanceRouter.post(
  '/:id/evaluate-discount',
  requireAuth,
  requirePermission(Permissions.QUOTATION_EVALUATE),
  (req, res, next) => controller.evaluateDiscount(req, res, next)
);

quotationGovernanceRouter.get(
  '/:id/discount-evaluation',
  requireAuth,
  requirePermission(Permissions.QUOTATION_READ),
  (req, res, next) => controller.getDiscountEvaluation(req, res, next)
);

quotationGovernanceRouter.get(
  '/:id/approvals',
  requireAuth,
  requirePermission(Permissions.QUOTATION_READ),
  (req, res, next) => controller.getQuotationApprovals(req, res, next)
);

export const approvalsRouter = Router();

approvalsRouter.get(
  '/pending',
  requireAuth,
  requirePermission(Permissions.APPROVAL_READ),
  (req, res, next) => controller.listPendingApprovals(req, res, next)
);

approvalsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission(Permissions.APPROVAL_APPROVE),
  (req, res, next) => controller.approveApproval(req, res, next)
);

approvalsRouter.post(
  '/:id/reject',
  requireAuth,
  requirePermission(Permissions.APPROVAL_REJECT),
  (req, res, next) => controller.rejectApproval(req, res, next)
);
