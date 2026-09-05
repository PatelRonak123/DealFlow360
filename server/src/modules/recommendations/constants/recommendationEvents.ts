export const RecommendationEventTypes = {
  GENERATED: 'GENERATED',
  ACCEPTED: 'ACCEPTED',
  DISMISSED: 'DISMISSED',
} as const;

export type RecommendationEventType =
  (typeof RecommendationEventTypes)[keyof typeof RecommendationEventTypes];
