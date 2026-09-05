import { z } from 'zod';

export const createCustomerTierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCustomerTierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const customerTierQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateCustomerTierInput = z.infer<typeof createCustomerTierSchema>;
export type UpdateCustomerTierInput = z.infer<typeof updateCustomerTierSchema>;
export type CustomerTierQueryInput = z.infer<typeof customerTierQuerySchema>;
