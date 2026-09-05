import { z } from 'zod';

export const adjustStockSchema = z.object({
  warehouseId: z.string().uuid('warehouseId must be a valid UUID'),
  productId: z.string().uuid('productId must be a valid UUID'),
  quantity: z
    .number()
    .int()
    .refine((val) => val !== 0, { message: 'Quantity cannot be 0' }),
  transactionType: z
    .enum(['STOCK_RECEIVED', 'STOCK_ADJUSTED'])
    .default('STOCK_ADJUSTED'),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const setStockSchema = z.object({
  warehouseId: z.string().uuid('warehouseId must be a valid UUID'),
  productId: z.string().uuid('productId must be a valid UUID'),
  quantityOnHand: z.number().int().min(0, 'quantityOnHand must be non-negative'),
  reorderLevel: z.number().int().min(0).default(0),
});

export const listInventorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  search: z.string().optional(),
  lowStock: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const listTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  transactionType: z.string().optional(),
});
