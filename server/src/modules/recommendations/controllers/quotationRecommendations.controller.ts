import { Request, Response, NextFunction } from 'express';
import { recommendationEngineService } from '../services/recommendationEngine.service.js';
import { recommendationAcceptanceService } from '../services/recommendationAcceptance.service.js';
import {
  acceptRecommendationSchema,
  dismissRecommendationSchema,
} from '../validators/recommendation.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';
import { UnauthorizedError } from '../../../common/errors/index.js';
import { AuthUserContext } from '../../rbac/types/index.js';

export class QuotationRecommendationsController {
  async getRecommendations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const user = req.user as AuthUserContext;
      const { quotationId } = req.params;
      const result = await recommendationEngineService.getRecommendationsForQuotation(
        quotationId,
        user
      );
      sendSuccess(
        res,
        result,
        'Quotation recommendations retrieved successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async acceptRecommendation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const user = req.user as AuthUserContext;
      const { quotationId, recommendationId } = req.params;
      const validated = acceptRecommendationSchema.parse(req.body || {});

      const result = await recommendationAcceptanceService.acceptRecommendation(
        quotationId,
        recommendationId,
        validated,
        user
      );

      sendSuccess(
        res,
        {
          item: result.item,
          quotation: result.quotation,
        },
        result.message,
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async dismissRecommendation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const user = req.user as AuthUserContext;
      const { quotationId, recommendationId } = req.params;
      dismissRecommendationSchema.parse(req.body || {});

      const result = await recommendationAcceptanceService.dismissRecommendation(
        quotationId,
        recommendationId,
        user
      );

      sendSuccess(res, null, result.message, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const quotationRecommendationsController =
  new QuotationRecommendationsController();
