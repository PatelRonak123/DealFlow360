import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { requireAuth } from '../../auth/middleware/auth.middleware.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', notificationsController.listNotifications);
notificationsRouter.patch('/:id/read', notificationsController.markNotificationRead);
notificationsRouter.post('/mark-all-read', notificationsController.markAllNotificationsRead);
