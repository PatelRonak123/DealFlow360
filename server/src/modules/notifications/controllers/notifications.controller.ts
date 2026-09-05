import { Request, Response, NextFunction } from 'express';
import { notificationsService, NotificationsService } from '../services/notifications.service.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';
import { AuthUserContext } from '../../rbac/types/index.js';

export class NotificationsController {
  constructor(private readonly service: NotificationsService = notificationsService) {}

  public listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthUserContext;
      const activeRole = (req.query.role as string) || undefined;
      const notifications = await this.service.getNotificationsForUser(user, activeRole);
      sendSuccess(res, notifications, 'Notifications retrieved successfully', HttpStatus.OK);
    } catch (err) {
      next(err);
    }
  };

  public markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthUserContext;
      const { id } = req.params;
      const userKey = user.userId || user.email.toLowerCase();
      const success = this.service.markNotificationRead(id, userKey);
      sendSuccess(res, { success }, 'Notification marked as read', HttpStatus.OK);
    } catch (err) {
      next(err);
    }
  };

  public markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthUserContext;
      const { ids } = req.body || {};
      const userKey = user.userId || user.email.toLowerCase();
      const notificationIds = Array.isArray(ids) ? ids : [];

      let idsToMark = notificationIds;
      if (idsToMark.length === 0) {
        const currentNotifs = await this.service.getNotificationsForUser(user, req.query.role as string);
        idsToMark = currentNotifs.map((n) => n.id);
      }

      const success = this.service.markAllNotificationsRead(userKey, idsToMark);
      sendSuccess(res, { success }, 'All notifications marked as read', HttpStatus.OK);
    } catch (err) {
      next(err);
    }
  };
}

export const notificationsController = new NotificationsController();
