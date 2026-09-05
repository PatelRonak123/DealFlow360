import { Request, Response, NextFunction } from 'express';
import { pricingService } from '../services/pricing.service.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';
import { z } from 'zod';

const resolvePriceQuerySchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  priceListId: z.string().uuid('Invalid price list ID').optional(),
  currency: z.string().trim().optional(),
});

export class PricingController {
  async resolvePrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = resolvePriceQuerySchema.parse(req.query);
      const resolution = await pricingService.resolveProductPrice({
        productId: query.productId,
        priceListId: query.priceListId,
        currency: query.currency,
      });

      sendSuccess(res, resolution, 'Product price resolved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
}

export const pricingController = new PricingController();
