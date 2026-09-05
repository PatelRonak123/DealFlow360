import { Router } from 'express';
import { subscriptionsController } from '../controllers/subscriptions.controller.js';
import { requireAuth, requireRole } from '../../auth/middleware/auth.middleware.js';
import { Roles } from '../../rbac/constants/roles.js';

export const subscriptionsRouter = Router();

subscriptionsRouter.use(requireAuth, requireRole(Roles.SALES_MANAGER, Roles.FINANCE, Roles.ADMIN));

subscriptionsRouter.get('/', subscriptionsController.list.bind(subscriptionsController));
subscriptionsRouter.get('/:id', subscriptionsController.getById.bind(subscriptionsController));
subscriptionsRouter.post('/:id/renew', subscriptionsController.renew.bind(subscriptionsController));
subscriptionsRouter.post('/:id/cancel', subscriptionsController.cancel.bind(subscriptionsController));
