import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../../auth/middleware/auth.middleware.js';
import { Roles } from '../../rbac/constants/roles.js';

export const adminRouter = Router();

// Strict Admin role enforcement for /api/v1/admin routes
adminRouter.use(requireAuth);
adminRouter.use(requireRole(Roles.ADMIN));

adminRouter.get('/dashboard', (req, res, next) => adminController.getDashboardMetrics(req, res, next));
adminRouter.get('/settings', (req, res, next) => adminController.getSettings(req, res, next));
adminRouter.patch('/settings', (req, res, next) => adminController.updateSettings(req, res, next));
