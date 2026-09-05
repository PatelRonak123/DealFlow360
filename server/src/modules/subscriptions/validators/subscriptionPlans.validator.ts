import { z } from 'zod';

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(255),
  code: z
    .string()
    .min(2, 'Plan code is required')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Plan code must be uppercase letters, numbers, hyphens or underscores (e.g. ENTERPRISE_MONTHLY)'),
  description: z.string().max(1000).optional().nullable(),
  billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid monetary amount (e.g. 999.00)'),
  currency: z.string().min(3).max(10).default('INR'),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true).optional(),
});

export const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Plan code must be uppercase letters, numbers, hyphens or underscores')
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid monetary amount').optional(),
  currency: z.string().min(3).max(10).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const subscriptionPlanQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
  })
  .transform((data) => ({
    ...data,
    limit: data.pageSize || data.limit || 20,
  }));

export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>;
export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>;
export type SubscriptionPlanQueryInput = z.infer<typeof subscriptionPlanQuerySchema>;
