import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase alphanumeric, dash, or underscore characters'),
  address: z.string().max(1000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default('India'),
  pincode: z.string().max(20).optional().nullable(),
  priority: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/)
    .optional(),
  address: z.string().max(1000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional(),
  pincode: z.string().max(20).optional().nullable(),
  priority: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const listWarehousesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});
