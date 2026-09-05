import { z } from 'zod';

export const submitQuotationSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const evaluateDiscountSchema = z.object({
  // optional preview overrides or options
  previewOnly: z.boolean().optional().default(true),
});

export const approveApprovalSchema = z.object({
  comments: z.string().max(1000).optional(),
});

export const rejectApprovalSchema = z.object({
  comments: z
    .string({ required_error: 'Rejection reason is required' })
    .min(3, 'Rejection reason must be at least 3 characters')
    .max(1000),
});

export const pendingApprovalsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  approvalLevel: z.enum(['MANAGER', 'FINANCE']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'INVALIDATED']).optional().default('PENDING'),
});

export type SubmitQuotationInput = z.infer<typeof submitQuotationSchema>;
export type EvaluateDiscountInput = z.infer<typeof evaluateDiscountSchema>;
export type ApproveApprovalInput = z.infer<typeof approveApprovalSchema>;
export type RejectApprovalInput = z.infer<typeof rejectApprovalSchema>;
export type PendingApprovalsQueryInput = z.infer<typeof pendingApprovalsQuerySchema>;
