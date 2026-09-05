import { Request, Response, NextFunction } from 'express';
import { priceListsService } from '../services/priceLists.service.js';
import {
  createPriceListSchema,
  updatePriceListSchema,
  priceListQuerySchema,
  createPriceListItemSchema,
  updatePriceListItemSchema,
  priceListItemQuerySchema,
} from '../validators/priceList.validator.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class PriceListsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = priceListQuerySchema.parse(req.query);
      const result = await priceListsService.listPriceLists(query);

      sendSuccess(
        res,
        result.items,
        'Price lists retrieved successfully',
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
      const list = await priceListsService.getPriceListById(req.params.id);
      sendSuccess(res, list, 'Price list retrieved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createPriceListSchema.parse(req.body);
      const created = await priceListsService.createPriceList(input);
      sendSuccess(res, created, 'Price list created successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updatePriceListSchema.parse(req.body);
      const updated = await priceListsService.updatePriceList(req.params.id, input);
      sendSuccess(res, updated, 'Price list updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await priceListsService.deletePriceList(req.params.id);
      sendSuccess(res, null, 'Price list deleted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  // --- Price List Items ---

  async listItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = priceListItemQuerySchema.parse(req.query);
      const result = await priceListsService.listPriceListItems(req.params.priceListId, query);

      sendSuccess(
        res,
        result.items,
        'Price list items retrieved successfully',
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

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createPriceListItemSchema.parse(req.body);
      const created = await priceListsService.addProductPrice(req.params.priceListId, input);
      sendSuccess(res, created, 'Product price added to price list successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updatePriceListItemSchema.parse(req.body);
      const updated = await priceListsService.updateProductPrice(
        req.params.priceListId,
        req.params.itemId,
        input
      );
      sendSuccess(res, updated, 'Product price updated successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await priceListsService.deleteProductPrice(
        req.params.priceListId,
        req.params.itemId
      );
      sendSuccess(res, null, 'Product price removed from price list successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const priceListsController = new PriceListsController();
