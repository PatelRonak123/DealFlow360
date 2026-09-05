import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';
import { updateSettingsSchema } from '../validators/settings.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class AdminController {
  async getDashboardMetrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getDashboardMetrics();
      sendSuccess(res, data, 'Admin dashboard metrics retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getSettings();
      sendSuccess(res, data, 'System settings retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateSettingsSchema.parse(req.body);
      const updated = await adminService.updateSettings(input);
      sendSuccess(res, updated, 'System settings updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
