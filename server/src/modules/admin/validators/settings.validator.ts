import { z } from 'zod';

export const updateSettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255).optional(),
  supportEmail: z.string().email('Invalid support email').max(255).optional(),
  supportPhone: z.string().max(50).optional().nullable(),
  defaultCurrency: z.string().min(3).max(10).optional(),
  defaultTaxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Tax rate must be a valid percentage (e.g. 18.00)').optional(),
  quoteExpirationDays: z.string().max(10).optional(),
  approvalThresholdPercent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Approval threshold must be a valid percentage').optional(),
  companyAddress: z.string().max(500).optional().nullable(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
