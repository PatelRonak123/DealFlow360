import { Request, Response, NextFunction } from 'express';
import { subscriptionPlansService } from '../services/subscriptionPlans.service.js';
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  subscriptionPlanQuerySchema,
} from '../validators/subscriptionPlans.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class SubscriptionPlansController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = subscriptionPlanQuerySchema.parse(req.query);
      const result = await subscriptionPlansService.listPlans(query);

      sendSuccess(res, result.items, 'Subscription plans retrieved successfully', HttpStatus.OK, {
        page: result.page,
        limit: result.limit,
        pageSize: result.limit,
        total: result.total,
        totalItems: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await subscriptionPlansService.getPlanById(req.params.id);
      sendSuccess(res, plan, 'Subscription plan retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createSubscriptionPlanSchema.parse(req.body);
      const created = await subscriptionPlansService.createPlan(input);
      sendSuccess(res, created, 'Subscription plan created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateSubscriptionPlanSchema.parse(req.body);
      const updated = await subscriptionPlansService.updatePlan(req.params.id, input);
      sendSuccess(res, updated, 'Subscription plan updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await subscriptionPlansService.deletePlan(req.params.id);
      sendSuccess(res, null, 'Subscription plan deactivated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionPlansController = new SubscriptionPlansController();
