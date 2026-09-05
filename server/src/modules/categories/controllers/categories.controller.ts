import { Request, Response, NextFunction } from 'express';
import { categoriesService } from '../services/categories.service.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from '../validators/category.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class CategoriesController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = categoryQuerySchema.parse(req.query);
      const result = await categoriesService.listCategories(query);

      sendSuccess(
        res,
        result.items,
        'Categories retrieved successfully',
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
      const category = await categoriesService.getCategoryById(req.params.id);
      sendSuccess(res, category, 'Category retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createCategorySchema.parse(req.body);
      const created = await categoriesService.createCategory(input);
      sendSuccess(res, created, 'Category created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateCategorySchema.parse(req.body);
      const updated = await categoriesService.updateCategory(req.params.id, input);
      sendSuccess(res, updated, 'Category updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoriesService.deleteCategory(req.params.id);
      sendSuccess(res, null, 'Category deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
