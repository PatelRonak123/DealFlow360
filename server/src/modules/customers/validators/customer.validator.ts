import { z } from 'zod';
import { CustomerStatuses } from '../constants/customerStatus.js';

export const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255, 'Company name must not exceed 255 characters'),
  contactName: z.string().max(255, 'Contact name must not exceed 255 characters').optional().nullable(),
  email: z.string().email('Invalid email address').max(255, 'Email must not exceed 255 characters'),
  phone: z.string().max(50, 'Phone must not exceed 50 characters').optional().nullable(),
  customerTierId: z.string().uuid('Invalid customer tier ID'),
  status: z.enum([CustomerStatuses.ACTIVE, CustomerStatuses.INACTIVE]).default(CustomerStatuses.ACTIVE),
});

export const updateCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255, 'Company name must not exceed 255 characters').optional(),
  contactName: z.string().max(255, 'Contact name must not exceed 255 characters').optional().nullable(),
  email: z.string().email('Invalid email address').max(255, 'Email must not exceed 255 characters').optional(),
  phone: z.string().max(50, 'Phone must not exceed 50 characters').optional().nullable(),
  customerTierId: z.string().uuid('Invalid customer tier ID').optional(),
  status: z.enum([CustomerStatuses.ACTIVE, CustomerStatuses.INACTIVE]).optional(),
});

export const updateCustomerStatusSchema = z.object({
  status: z.enum([CustomerStatuses.ACTIVE, CustomerStatuses.INACTIVE]),
});

export const customerQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    customerTierId: z.string().uuid().optional(),
    status: z.enum([CustomerStatuses.ACTIVE, CustomerStatuses.INACTIVE]).optional(),
  })
  .transform((data) => ({
    ...data,
    limit: data.pageSize || data.limit || 20,
  }));

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type UpdateCustomerStatusInput = z.infer<typeof updateCustomerStatusSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
