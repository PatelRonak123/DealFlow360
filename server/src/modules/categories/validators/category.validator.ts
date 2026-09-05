import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const categoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
