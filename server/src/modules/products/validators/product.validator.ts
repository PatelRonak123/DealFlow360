import { z } from 'zod';
import { ProductTypes } from '../constants/productTypes.js';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(100, 'SKU must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'SKU must contain only alphanumeric characters, dashes, and underscores'),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
  categoryId: z.string().uuid('Invalid category ID'),
  productType: z.enum([ProductTypes.ONE_TIME, ProductTypes.RECURRING, ProductTypes.SERVICE]).default(ProductTypes.ONE_TIME),
  basePrice: z
    .union([z.number().positive('Base price must be greater than 0'), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num <= 0) {
        throw new Error('Base price must be a valid positive number');
      }
      return num.toFixed(2);
    }),
  currency: z.string().min(1).max(10).default('INR'),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters').optional(),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(100, 'SKU must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'SKU must contain only alphanumeric characters, dashes, and underscores')
    .optional(),
  description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  productType: z.enum([ProductTypes.ONE_TIME, ProductTypes.RECURRING, ProductTypes.SERVICE]).optional(),
  basePrice: z
    .union([z.number().positive('Base price must be greater than 0'), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num <= 0) {
        throw new Error('Base price must be a valid positive number');
      }
      return num.toFixed(2);
    })
    .optional(),
  currency: z.string().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  productType: z.enum([ProductTypes.ONE_TIME, ProductTypes.RECURRING, ProductTypes.SERVICE]).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
