import { Request, Response, NextFunction } from 'express';
import { recommendationRulesService } from '../services/recommendationRules.service.js';
import {
  createRecommendationRuleSchema,
  updateRecommendationRuleSchema,
  listRecommendationRulesSchema,
} from '../validators/recommendation.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class RecommendationRulesController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createRecommendationRuleSchema.parse(req.body);
      const rule = await recommendationRulesService.createRule(validated);
      sendSuccess(
        res,
        rule,
        'Recommendation rule created successfully',
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await recommendationRulesService.getRuleById(req.params.id);
      sendSuccess(
        res,
        rule,
        'Recommendation rule retrieved successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateRecommendationRuleSchema.parse(req.body);
      const updated = await recommendationRulesService.updateRule(
        req.params.id,
        validated
      );
      sendSuccess(
        res,
        updated,
        'Recommendation rule updated successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await recommendationRulesService.deleteRule(req.params.id);
      sendSuccess(
        res,
        { id: req.params.id },
        'Recommendation rule deleted successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = listRecommendationRulesSchema.parse(req.query);
      const result = await recommendationRulesService.listRules(validated);
      sendSuccess(
        res,
        result.rules,
        'Recommendation rules retrieved successfully',
        HttpStatus.OK,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }
}

export const recommendationRulesController = new RecommendationRulesController();
