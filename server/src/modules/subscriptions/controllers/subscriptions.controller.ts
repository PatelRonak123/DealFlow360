import { Request, Response, NextFunction } from 'express';
import { subscriptionsService } from '../services/subscriptions.service.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class SubscriptionsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, customerId, page, limit } = req.query;
      const result = await subscriptionsService.listSubscriptions({
        status: status as string | undefined,
        search: search as string | undefined,
        customerId: customerId as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      sendSuccess(
        res,
        {
          items: result.items,
          summary: result.summary,
        },
        'Subscriptions retrieved successfully',
        HttpStatus.OK,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await subscriptionsService.getSubscriptionById(id);
      sendSuccess(res, result, 'Subscription retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async renew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const result = await subscriptionsService.renewSubscription(id, notes);
      sendSuccess(res, result, 'Subscription renewed successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await subscriptionsService.cancelSubscription(id, reason);
      sendSuccess(res, result, 'Subscription cancelled successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
