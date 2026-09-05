import { Request, Response, NextFunction } from 'express';
import { customersService } from '../services/customers.service.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  updateCustomerStatusSchema,
  customerQuerySchema,
} from '../validators/customer.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class CustomersController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = customerQuerySchema.parse(req.query);
      const result = await customersService.listCustomers(query);

      sendSuccess(
        res,
        result.items,
        'Customers retrieved successfully',
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
      const customer = await customersService.getCustomerById(req.params.id);
      sendSuccess(res, customer, 'Customer retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createCustomerSchema.parse(req.body);
      const created = await customersService.createCustomer(input);
      sendSuccess(res, created, 'Customer created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateCustomerSchema.parse(req.body);
      const updated = await customersService.updateCustomer(req.params.id, input);
      sendSuccess(res, updated, 'Customer updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateCustomerStatusSchema.parse(req.body);
      const updated = await customersService.updateCustomerStatus(req.params.id, input);
      sendSuccess(res, updated, 'Customer status updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customersService.deleteCustomer(req.params.id);
      sendSuccess(res, null, 'Customer deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const customersController = new CustomersController();
