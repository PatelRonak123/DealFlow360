import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role must be assigned'),
  isActive: z.boolean().default(true).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  email: z.string().email('Invalid email address').max(255).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100).optional(),
  roleIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const userQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    role: z.string().trim().optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
  })
  .transform((data) => ({
    ...data,
    limit: data.pageSize || data.limit || 20,
  }));

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
