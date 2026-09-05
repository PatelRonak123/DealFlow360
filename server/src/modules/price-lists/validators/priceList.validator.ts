import { z } from 'zod';

export const createPriceListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  currency: z.string().min(1).max(10).default('INR'),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updatePriceListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  currency: z.string().min(1).max(10).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const priceListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  currency: z.string().trim().optional(),
  isDefault: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const createPriceListItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  price: z
    .union([z.number().min(0, 'Price must be greater than or equal to 0'), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0) {
        throw new Error('Price must be a valid non-negative number');
      }
      return num.toFixed(2);
    }),
});

export const updatePriceListItemSchema = z.object({
  price: z
    .union([z.number().min(0, 'Price must be greater than or equal to 0'), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0) {
        throw new Error('Price must be a valid non-negative number');
      }
      return num.toFixed(2);
    }),
});

export const priceListItemQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type CreatePriceListInput = z.infer<typeof createPriceListSchema>;
export type UpdatePriceListInput = z.infer<typeof updatePriceListSchema>;
export type PriceListQueryInput = z.infer<typeof priceListQuerySchema>;
export type CreatePriceListItemInput = z.infer<typeof createPriceListItemSchema>;
export type UpdatePriceListItemInput = z.infer<typeof updatePriceListItemSchema>;
export type PriceListItemQueryInput = z.infer<typeof priceListItemQuerySchema>;
