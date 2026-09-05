import { z } from 'zod';

export const createCustomerTierDiscountRuleSchema = z.object({
  customerTierId: z.string().uuid('Invalid customer tier ID'),
  maxDiscountPercent: z
    .union([z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100'), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Max discount percentage must be a number between 0 and 100');
      }
      return num.toFixed(2);
    }),
  isActive: z.boolean().optional().default(true),
});

export const updateCustomerTierDiscountRuleSchema = z.object({
  maxDiscountPercent: z
    .union([z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100'), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Max discount percentage must be a number between 0 and 100');
      }
      return num.toFixed(2);
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const createCategoryDiscountRuleSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  maxDiscountPercent: z
    .union([z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100'), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Max discount percentage must be a number between 0 and 100');
      }
      return num.toFixed(2);
    }),
  isActive: z.boolean().optional().default(true),
});

export const updateCategoryDiscountRuleSchema = z.object({
  maxDiscountPercent: z
    .union([z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100'), z.string()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Max discount percentage must be a number between 0 and 100');
      }
      return num.toFixed(2);
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const discountRuleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateCustomerTierDiscountRuleInput = z.infer<typeof createCustomerTierDiscountRuleSchema>;
export type UpdateCustomerTierDiscountRuleInput = z.infer<typeof updateCustomerTierDiscountRuleSchema>;
export type CreateCategoryDiscountRuleInput = z.infer<typeof createCategoryDiscountRuleSchema>;
export type UpdateCategoryDiscountRuleInput = z.infer<typeof updateCategoryDiscountRuleSchema>;
export type DiscountRuleQueryInput = z.infer<typeof discountRuleQuerySchema>;
