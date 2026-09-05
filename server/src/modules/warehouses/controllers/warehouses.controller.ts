import { Request, Response, NextFunction } from 'express';
import { warehousesService } from '../services/warehouses.service.js';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  listWarehousesSchema,
} from '../validators/warehouse.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class WarehousesController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createWarehouseSchema.parse(req.body);
      const warehouse = await warehousesService.createWarehouse(validated);
      sendSuccess(
        res,
        warehouse,
        'Warehouse created successfully',
        HttpStatus.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehousesService.getWarehouseById(req.params.id);
      sendSuccess(
        res,
        warehouse,
        'Warehouse retrieved successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateWarehouseSchema.parse(req.body);
      const updated = await warehousesService.updateWarehouse(
        req.params.id,
        validated
      );
      sendSuccess(
        res,
        updated,
        'Warehouse updated successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await warehousesService.deleteWarehouse(req.params.id);
      sendSuccess(
        res,
        { id: req.params.id },
        'Warehouse deleted successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = listWarehousesSchema.parse(req.query);
      const result = await warehousesService.listWarehouses(validated);
      sendSuccess(
        res,
        result.warehouses,
        'Warehouses retrieved successfully',
        HttpStatus.OK,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }
}

export const warehousesController = new WarehousesController();
