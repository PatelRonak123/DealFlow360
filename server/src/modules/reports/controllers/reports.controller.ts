import { Request, Response, NextFunction } from 'express';
import { reportsService } from '../services/reports.service.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class ReportsController {
  async getRevenueAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getRevenueAnalytics();
      sendSuccess(res, data, 'Revenue analytics generated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async getPipelineSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getRevenueAnalytics();
      sendSuccess(
        res,
        {
          kpis: data.kpis,
          stageFunnel: data.stageFunnel,
          repPerformance: data.repPerformance,
        },
        'Pipeline summary generated successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
