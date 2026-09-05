import { z } from 'zod';
import { RecommendationTypes } from '../constants/recommendationTypes.js';
import { RecommendationPriorities } from '../constants/recommendationPriorities.js';

export const createRecommendationRuleSchema = z
  .object({
    sourceProductId: z.string().uuid('sourceProductId must be a valid UUID'),
    recommendedProductId: z.string().uuid('recommendedProductId must be a valid UUID'),
    recommendationType: z.enum([RecommendationTypes.CROSS_SELL, RecommendationTypes.UPSELL]),
    priority: z
      .enum([
        RecommendationPriorities.LOW,
        RecommendationPriorities.MEDIUM,
        RecommendationPriorities.HIGH,
      ])
      .default(RecommendationPriorities.MEDIUM),
    defaultQuantity: z.number().int().min(1, 'defaultQuantity must be at least 1').default(1),
    description: z.string().max(1000).optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.sourceProductId !== data.recommendedProductId, {
    message: 'sourceProductId and recommendedProductId cannot be identical',
    path: ['recommendedProductId'],
  });

export const updateRecommendationRuleSchema = z.object({
  recommendationType: z
    .enum([RecommendationTypes.CROSS_SELL, RecommendationTypes.UPSELL])
    .optional(),
  priority: z
    .enum([
      RecommendationPriorities.LOW,
      RecommendationPriorities.MEDIUM,
      RecommendationPriorities.HIGH,
    ])
    .optional(),
  defaultQuantity: z.number().int().min(1, 'defaultQuantity must be at least 1').optional(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listRecommendationRulesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sourceProductId: z.string().uuid().optional(),
  recommendedProductId: z.string().uuid().optional(),
  recommendationType: z
    .enum([RecommendationTypes.CROSS_SELL, RecommendationTypes.UPSELL])
    .optional(),
  priority: z
    .enum([
      RecommendationPriorities.LOW,
      RecommendationPriorities.MEDIUM,
      RecommendationPriorities.HIGH,
    ])
    .optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const acceptRecommendationSchema = z.object({
  quantity: z.number().int().min(1, 'quantity must be at least 1').optional(),
  discountPercent: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'discountPercent must be a valid decimal')
    .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 100, {
      message: 'discountPercent must be between 0 and 100',
    })
    .default('0.00'),
});

export const dismissRecommendationSchema = z.object({
  reason: z.string().max(500).optional(),
});
