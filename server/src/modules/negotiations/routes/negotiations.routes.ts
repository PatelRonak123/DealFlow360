import { Router } from 'express';
import { negotiationsController } from '../controllers/negotiations.controller.js';
import { requireAuth, requireRole } from '../../auth/middleware/auth.middleware.js';
import { Roles } from '../../rbac/constants/roles.js';

export const negotiationsRouter = Router();

// Protect all negotiation routes for internal sales staff
negotiationsRouter.use(
  requireAuth,
  requireRole(Roles.SALES_REP, Roles.SALES_MANAGER, Roles.ADMIN, Roles.FINANCE)
);

negotiationsRouter.get('/', (req, res, next) => negotiationsController.list(req, res, next));
negotiationsRouter.get('/:id', (req, res, next) => negotiationsController.getById(req, res, next));
negotiationsRouter.post('/:id/decline', (req, res, next) => negotiationsController.decline(req, res, next));
negotiationsRouter.post('/:id/create-revision', (req, res, next) =>
  negotiationsController.createRevision(req, res, next)
);
