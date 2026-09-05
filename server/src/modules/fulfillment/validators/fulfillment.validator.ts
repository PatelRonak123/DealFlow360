import { z } from 'zod';

export const createFulfillmentSchema = z.object({
  quotationId: z.string().uuid('quotationId must be a valid UUID'),
});

export const overrideAllocationsSchema = z.object({
  allocations: z
    .array(
      z.object({
        warehouseId: z.string().uuid('warehouseId must be a valid UUID'),
        productId: z.string().uuid('productId must be a valid UUID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'At least one allocation item is required'),
});

export const fulfillItemsSchema = z.object({
  items: z
    .array(
      z.object({
        allocationId: z.string().uuid('allocationId must be a valid UUID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    )
    .optional(),
  notes: z.string().max(500).optional(),
});

export const cancelFulfillmentSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

export const listFulfillmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  quotationId: z.string().uuid().optional(),
  search: z.string().optional(),
});
