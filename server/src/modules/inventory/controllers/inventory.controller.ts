import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service.js';
import { InventoryRepository } from '../repositories/inventory.repository.js';
import { WarehousesRepository } from '../../warehouses/repositories/warehouses.repository.js';
import { ProductsRepository } from '../../products/repositories/products.repository.js';
import {
  adjustStockSchema,
  setStockSchema,
  listInventorySchema,
  listTransactionsSchema,
} from '../validators/inventory.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

const inventoryRepo = new InventoryRepository();
const warehouseRepo = new WarehousesRepository();
const productRepo = new ProductsRepository();
export const inventoryService = new InventoryService(
  inventoryRepo,
  warehouseRepo,
  productRepo
);

export class InventoryController {
  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const validated = adjustStockSchema.parse(req.body);
      const userId = req.user.userId;
      const result = await inventoryService.adjustStock(validated, userId);
      sendSuccess(res, result, 'Stock adjusted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async setStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const validated = setStockSchema.parse(req.body);
      const userId = req.user.userId;
      const result = await inventoryService.setStock(validated, userId);
      sendSuccess(res, result, 'Stock set successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async getProductSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      const result = await inventoryService.getProductInventorySummary(productId);
      sendSuccess(res, result, 'Product inventory summary retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = listInventorySchema.parse(req.query);
      const result = await inventoryService.listInventory(validated);
      sendSuccess(
        res,
        result.data,
        'Inventory items retrieved successfully',
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

  async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = listTransactionsSchema.parse(req.query);
      const result = await inventoryService.listTransactions(validated);
      sendSuccess(
        res,
        result.data,
        'Inventory transactions retrieved successfully',
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
}

export const inventoryController = new InventoryController();
