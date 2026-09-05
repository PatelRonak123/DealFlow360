import { z } from 'zod';
import { QuotationStatuses } from '../constants/quotationStatus.js';

export const createQuotationItemInputSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be greater than 0'),
  discountPercent: z
    .union([z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100'), z.string()])
    .optional()
    .default(0)
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Discount percentage must be between 0 and 100');
      }
      return num.toFixed(2);
    }),
});

export const createQuotationSchema = z
  .object({
    customerId: z.string().uuid('Invalid customer ID'),
    priceListId: z.string().uuid('Invalid price list ID'),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format'),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
    notes: z.string().max(2000, 'Notes must not exceed 2000 characters').optional().nullable(),
    currency: z.string().max(10).optional().default('INR'),
    items: z.array(createQuotationItemInputSchema).optional(),
    submitForApproval: z.boolean().optional(),
    submitNotes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => new Date(data.expiryDate) >= new Date(data.issueDate),
    {
      message: 'Expiry date must be greater than or equal to issue date',
      path: ['expiryDate'],
    }
  );

export const updateQuotationSchema = z
  .object({
    customerId: z.string().uuid('Invalid customer ID').optional(),
    priceListId: z.string().uuid('Invalid price list ID').optional(),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format').optional(),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format').optional(),
    notes: z.string().max(2000, 'Notes must not exceed 2000 characters').optional().nullable(),
    status: z.enum([
      QuotationStatuses.DRAFT,
      QuotationStatuses.SENT,
      QuotationStatuses.CANCELLED,
      QuotationStatuses.EXPIRED,
    ]).optional(),
  })
  .refine(
    (data) => {
      if (data.issueDate && data.expiryDate) {
        return new Date(data.expiryDate) >= new Date(data.issueDate);
      }
      return true;
    },
    {
      message: 'Expiry date must be greater than or equal to issue date',
      path: ['expiryDate'],
    }
  );

export const addQuotationItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be greater than 0'),
  discountPercent: z
    .union([z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100'), z.string()])
    .optional()
    .default(0)
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Discount percentage must be between 0 and 100');
      }
      return num.toFixed(2);
    }),
});

export const updateQuotationItemSchema = z.object({
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be greater than 0').optional(),
  discountPercent: z
    .union([z.number().min(0, 'Discount must be >= 0').max(100, 'Discount must be <= 100'), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Discount percentage must be between 0 and 100');
      }
      return num.toFixed(2);
    }),
});

export const quotationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().optional(),
  status: z.enum([
    QuotationStatuses.DRAFT,
    QuotationStatuses.SENT,
    QuotationStatuses.CANCELLED,
    QuotationStatuses.EXPIRED,
  ]).optional(),
  customerId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type AddQuotationItemInput = z.infer<typeof addQuotationItemSchema>;
export type UpdateQuotationItemInput = z.infer<typeof updateQuotationItemSchema>;
export type QuotationQueryInput = z.infer<typeof quotationQuerySchema>;
