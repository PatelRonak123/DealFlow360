import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must not exceed 50 characters')
    .regex(/^[A-Z0-9_]+$/, 'Role name must be uppercase letters, numbers, and underscores (e.g. CUSTOM_ANALYST)'),
  description: z.string().max(500).optional().nullable(),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const updateRoleSchema = z.object({
  description: z.string().max(500).optional().nullable(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
