import { Request, Response, NextFunction } from 'express';
import { quotationsService } from '../services/quotations.service.js';
import {
  createQuotationSchema,
  updateQuotationSchema,
  addQuotationItemSchema,
  updateQuotationItemSchema,
  quotationQuerySchema,
  negotiateQuotationSchema,
  reviseQuotationSchema,
  quotationOutcomeSchema,
} from '../validators/quotation.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

export class QuotationsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const query = quotationQuerySchema.parse(req.query);
      const result = await quotationsService.listQuotations(query, req.user);

      sendSuccess(
        res,
        result.items,
        'Quotations retrieved successfully',
        HttpStatus.OK,
        {
          page: result.page,
          limit: result.limit,
          pageSize: result.limit,
          total: result.total,
          totalItems: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPreviousPage: result.page > 1,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const quotation = await quotationsService.getQuotationById(req.params.id, req.user);
      sendSuccess(res, quotation, 'Quotation retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = createQuotationSchema.parse(req.body);
      const created = await quotationsService.createQuotation(input, req.user);
      sendSuccess(res, created, 'Quotation created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = updateQuotationSchema.parse(req.body);
      const updated = await quotationsService.updateQuotation(req.params.id, input, req.user);
      sendSuccess(res, updated, 'Quotation updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const cancelled = await quotationsService.cancelQuotation(req.params.id, req.user);
      sendSuccess(res, cancelled, 'Quotation cancelled successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  // --- Line Items ---

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = addQuotationItemSchema.parse(req.body);
      const result = await quotationsService.addItem(req.params.quotationId, input, req.user);
      sendSuccess(res, result, 'Item added to quotation successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = updateQuotationItemSchema.parse(req.body);
      const result = await quotationsService.updateItem(
        req.params.quotationId,
        req.params.itemId,
        input,
        req.user
      );
      sendSuccess(res, result, 'Quotation item updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const result = await quotationsService.deleteItem(
        req.params.quotationId,
        req.params.itemId,
        req.user
      );
      sendSuccess(res, result, 'Quotation item removed successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  // --- Workflow Endpoints ---

  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const updated = await quotationsService.sendQuotation(req.params.id, req.user);
      sendSuccess(res, updated, 'Quotation sent to customer successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async negotiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = negotiateQuotationSchema.parse(req.body);
      const updated = await quotationsService.negotiateQuotation(req.params.id, input, req.user);
      sendSuccess(res, updated, 'Quotation moved to negotiation successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async revise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = reviseQuotationSchema.parse(req.body);
      const revised = await quotationsService.reviseQuotation(req.params.id, input, req.user);
      sendSuccess(res, revised, 'Revised quotation created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async markWon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = quotationOutcomeSchema.parse(req.body);
      const updated = await quotationsService.markQuotationWon(req.params.id, input, req.user);
      sendSuccess(res, updated, 'Quotation marked as Won successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async markLost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = quotationOutcomeSchema.parse(req.body);
      const updated = await quotationsService.markQuotationLost(req.params.id, input, req.user);
      sendSuccess(res, updated, 'Quotation marked as Lost', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const quotationsController = new QuotationsController();
