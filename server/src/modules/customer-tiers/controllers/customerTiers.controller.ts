import { Request, Response, NextFunction } from 'express';
import { customerTiersService } from '../services/customerTiers.service.js';
import {
  createCustomerTierSchema,
  updateCustomerTierSchema,
  customerTierQuerySchema,
} from '../validators/customerTier.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class CustomerTiersController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = customerTierQuerySchema.parse(req.query);
      const result = await customerTiersService.listCustomerTiers(query);

      sendSuccess(
        res,
        result.items,
        'Customer tiers retrieved successfully',
        HttpStatus.OK,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tier = await customerTiersService.getCustomerTierById(req.params.id);
      sendSuccess(res, tier, 'Customer tier retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createCustomerTierSchema.parse(req.body);
      const created = await customerTiersService.createCustomerTier(input);
      sendSuccess(res, created, 'Customer tier created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateCustomerTierSchema.parse(req.body);
      const updated = await customerTiersService.updateCustomerTier(req.params.id, input);
      sendSuccess(res, updated, 'Customer tier updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customerTiersService.deleteCustomerTier(req.params.id);
      sendSuccess(res, null, 'Customer tier deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const customerTiersController = new CustomerTiersController();
