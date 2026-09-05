import { Request, Response, NextFunction } from 'express';
import { financeService, FinanceService } from '../services/finance.service.js';
import { sendSuccess } from '../../../common/utils/index.js';

export class FinanceController {
  private service: FinanceService;

  constructor(serviceInstance: FinanceService = financeService) {
    this.service = serviceInstance;
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.getDashboardOverview();
      sendSuccess(res, data, 'Finance dashboard metrics retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async listApprovals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query;
      const result = await this.service.listFinanceApprovals({
        status: status as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      sendSuccess(res, result, 'Finance approvals retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDealReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.getFinancialDealReview(id);
      sendSuccess(res, data, 'Financial deal review retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async approveDeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = (req as any).user;
      const result = await this.service.approveDeal(id, user.id, user.roles || user.role, comments);
      sendSuccess(res, result, 'Deal approved by Finance successfully');
    } catch (err) {
      next(err);
    }
  }

  async rejectDeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = (req as any).user;
      const result = await this.service.rejectDeal(id, user.id, user.roles || user.role, comments);
      sendSuccess(res, result, 'Deal rejected by Finance');
    } catch (err) {
      next(err);
    }
  }

  async returnDeal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const user = (req as any).user;
      const result = await this.service.returnDealForRevision(id, user.id, user.roles || user.role, comments);
      sendSuccess(res, result, 'Deal returned for commercial revision');
    } catch (err) {
      next(err);
    }
  }
}

export const financeController = new FinanceController();
