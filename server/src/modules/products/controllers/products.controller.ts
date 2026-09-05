import { Request, Response, NextFunction } from 'express';
import { productsService } from '../services/products.service.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validators/product.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class ProductsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = productQuerySchema.parse(req.query);
      const result = await productsService.listProducts(query);

      sendSuccess(
        res,
        result.items,
        'Products retrieved successfully',
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
      const product = await productsService.getProductById(req.params.id);
      sendSuccess(res, product, 'Product retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createProductSchema.parse(req.body);
      const created = await productsService.createProduct(input);
      sendSuccess(res, created, 'Product created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateProductSchema.parse(req.body);
      const updated = await productsService.updateProduct(req.params.id, input);
      sendSuccess(res, updated, 'Product updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productsService.deleteProduct(req.params.id);
      sendSuccess(res, null, 'Product deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
