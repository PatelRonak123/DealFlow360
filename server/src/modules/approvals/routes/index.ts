import { Router } from 'express';
import { requireAuth, requirePermission } from '../../auth/middleware/auth.middleware.js';
import { Permissions } from '../../rbac/constants/permissions.js';
import { DiscountGovernanceController } from '../../discount-governance/controllers/discountGovernance.controller.js';

const controller = new DiscountGovernanceController();

export const approvalsRouter = Router();

// All approval routes require authentication
approvalsRouter.use(requireAuth);

approvalsRouter.get(
  '/pending',
  requirePermission(Permissions.APPROVAL_READ),
  (req, res, next) => controller.listPendingApprovals(req, res, next)
);

approvalsRouter.post(
  '/:id/approve',
  requirePermission(Permissions.APPROVAL_APPROVE),
  (req, res, next) => controller.approveApproval(req, res, next)
);

approvalsRouter.post(
  '/:id/reject',
  requirePermission(Permissions.APPROVAL_REJECT),
  (req, res, next) => controller.rejectApproval(req, res, next)
);
