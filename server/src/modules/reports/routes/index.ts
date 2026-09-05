import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { requireAuth, requireRole } from '../../auth/middleware/auth.middleware.js';
import { Roles } from '../../rbac/constants/roles.js';

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requireRole(Roles.SALES_MANAGER, Roles.FINANCE, Roles.ADMIN));

reportsRouter.get('/revenue-analytics', reportsController.getRevenueAnalytics.bind(reportsController));
reportsRouter.get('/pipeline-summary', reportsController.getPipelineSummary.bind(reportsController));
