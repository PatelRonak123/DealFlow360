import { Request, Response, NextFunction } from 'express';
import { FulfillmentService } from '../services/fulfillment.service.js';
import { FulfillmentRepository } from '../repositories/fulfillment.repository.js';
import { InventoryAllocationService } from '../services/inventoryAllocation.service.js';
import { InventoryReservationService } from '../services/inventoryReservation.service.js';
import { InventoryRepository } from '../../inventory/repositories/inventory.repository.js';
import { QuotationsRepository } from '../../quotations/repositories/quotations.repository.js';
import {
  createFulfillmentSchema,
  overrideAllocationsSchema,
  fulfillItemsSchema,
  cancelFulfillmentSchema,
  listFulfillmentsSchema,
} from '../validators/fulfillment.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

const fulfillmentRepo = new FulfillmentRepository();
const inventoryRepo = new InventoryRepository();
const quotationRepo = new QuotationsRepository();
const allocationService = new InventoryAllocationService(inventoryRepo);
const reservationService = new InventoryReservationService(inventoryRepo);

export const fulfillmentService = new FulfillmentService(
  fulfillmentRepo,
  allocationService,
  reservationService,
  quotationRepo
);

export class FulfillmentController {
  async previewAllocation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quotationId } = req.params;
      const result = await fulfillmentService.previewAllocation(quotationId);
      sendSuccess(
        res,
        result,
        'Allocation plan preview generated successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const validated = createFulfillmentSchema.parse(req.body);
      const userId = req.user.userId;
      const result = await fulfillmentService.createFulfillment(
        validated.quotationId,
        userId
      );
      sendSuccess(
        res,
        result,
        'Fulfillment created and inventory allocated successfully',
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await fulfillmentService.getById(id);
      sendSuccess(
        res,
        result,
        'Fulfillment retrieved successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async getByQuotationId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quotationId } = req.params;
      const result = await fulfillmentService.getByQuotationId(quotationId);
      sendSuccess(
        res,
        result,
        'Fulfillments for quotation retrieved successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = listFulfillmentsSchema.parse(req.query);
      const result = await fulfillmentService.list(validated);
      sendSuccess(
        res,
        result.data,
        'Fulfillments retrieved successfully',
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

  async overrideAllocations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { id } = req.params;
      const validated = overrideAllocationsSchema.parse(req.body);
      const userId = req.user.userId;
      const result = await fulfillmentService.overrideAllocations(
        id,
        validated,
        userId
      );
      sendSuccess(
        res,
        result,
        'Fulfillment allocations updated and inventory rebalanced successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async fulfill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { id } = req.params;
      const validated = fulfillItemsSchema.parse(req.body);
      const userId = req.user.userId;
      const result = await fulfillmentService.fulfillItems(
        id,
        validated,
        userId
      );
      sendSuccess(
        res,
        result,
        'Fulfillment updated and inventory deducted successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const { id } = req.params;
      const validated = cancelFulfillmentSchema.parse(req.body);
      const userId = req.user.userId;
      const result = await fulfillmentService.cancelFulfillment(
        id,
        validated.reason,
        userId
      );
      sendSuccess(
        res,
        result,
        'Fulfillment cancelled and reserved inventory released successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }
}

export const fulfillmentController = new FulfillmentController();
