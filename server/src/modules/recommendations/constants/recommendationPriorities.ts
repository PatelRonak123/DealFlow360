export const RecommendationPriorities = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type RecommendationPriority =
  (typeof RecommendationPriorities)[keyof typeof RecommendationPriorities];

export const PriorityWeights: Record<RecommendationPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
