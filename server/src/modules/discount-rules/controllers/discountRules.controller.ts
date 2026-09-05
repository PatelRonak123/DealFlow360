import { Request, Response, NextFunction } from 'express';
import { discountRulesService } from '../services/discountRules.service.js';
import {
  createCustomerTierDiscountRuleSchema,
  updateCustomerTierDiscountRuleSchema,
  createCategoryDiscountRuleSchema,
  updateCategoryDiscountRuleSchema,
  discountRuleQuerySchema,
} from '../validators/discountRule.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class DiscountRulesController {
  // --- Customer Tier Discount Rules ---

  async listTierRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = discountRuleQuerySchema.parse(req.query);
      const result = await discountRulesService.listTierRules(query);

      sendSuccess(
        res,
        result.items,
        'Customer tier discount rules retrieved successfully',
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

  async getTierRuleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await discountRulesService.getTierRuleById(req.params.id);
      sendSuccess(res, rule, 'Customer tier discount rule retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async createTierRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createCustomerTierDiscountRuleSchema.parse(req.body);
      const created = await discountRulesService.createTierRule(input);
      sendSuccess(res, created, 'Customer tier discount rule created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateTierRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateCustomerTierDiscountRuleSchema.parse(req.body);
      const updated = await discountRulesService.updateTierRule(req.params.id, input);
      sendSuccess(res, updated, 'Customer tier discount rule updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async deleteTierRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await discountRulesService.deleteTierRule(req.params.id);
      sendSuccess(res, null, 'Customer tier discount rule deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  // --- Category Discount Rules ---

  async listCategoryRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = discountRuleQuerySchema.parse(req.query);
      const result = await discountRulesService.listCategoryRules(query);

      sendSuccess(
        res,
        result.items,
        'Category discount rules retrieved successfully',
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

  async getCategoryRuleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = await discountRulesService.getCategoryRuleById(req.params.id);
      sendSuccess(res, rule, 'Category discount rule retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async createCategoryRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createCategoryDiscountRuleSchema.parse(req.body);
      const created = await discountRulesService.createCategoryRule(input);
      sendSuccess(res, created, 'Category discount rule created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateCategoryRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateCategoryDiscountRuleSchema.parse(req.body);
      const updated = await discountRulesService.updateCategoryRule(req.params.id, input);
      sendSuccess(res, updated, 'Category discount rule updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategoryRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await discountRulesService.deleteCategoryRule(req.params.id);
      sendSuccess(res, null, 'Category discount rule deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  // --- Discount Resolution Endpoint ---

  async resolveEffectiveLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerTierId, categoryId } = req.query;
      const resolution = await discountRulesService.getEffectiveDiscountLimit({
        customerTierId: customerTierId as string | undefined,
        categoryId: categoryId as string | undefined,
      });

      sendSuccess(res, resolution, 'Effective discount limit resolved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const discountRulesController = new DiscountRulesController();
