import { Request, Response, NextFunction } from 'express';
import { negotiationsService, NegotiationsService } from '../services/negotiations.service.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

export class NegotiationsController {
  constructor(private readonly service: NegotiationsService = negotiationsService) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { status, search, page, limit } = req.query;
      const result = await this.service.listNegotiations(
        {
          status: typeof status === 'string' ? status : undefined,
          search: typeof search === 'string' ? search : undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
        req.user
      );

      sendSuccess(
        res,
        result.items,
        'Negotiation requests retrieved successfully',
        HttpStatus.OK,
        {
          page: result.page,
          limit: result.limit,
          pageSize: result.limit,
          total: result.total,
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

      const { id } = req.params;
      const data = await this.service.getNegotiationById(id, req.user);
      sendSuccess(res, data, 'Negotiation details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async decline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const { repResponse, responseNote, reason } = req.body;
      const responseText = repResponse || responseNote || reason || '';

      const updated = await this.service.declineNegotiation(id, responseText, req.user);
      sendSuccess(res, updated, 'Negotiation counter-offer declined successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async createRevision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { id } = req.params;
      const revisedQuotation = await this.service.createRevisionFromNegotiation(id, req.user);
      sendSuccess(
        res,
        revisedQuotation,
        'Revised quotation created successfully from negotiation request',
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  }
}

export const negotiationsController = new NegotiationsController();
