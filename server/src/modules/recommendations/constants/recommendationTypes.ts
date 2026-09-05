export const RecommendationTypes = {
  CROSS_SELL: 'CROSS_SELL',
  UPSELL: 'UPSELL',
} as const;

export type RecommendationType =
  (typeof RecommendationTypes)[keyof typeof RecommendationTypes];
