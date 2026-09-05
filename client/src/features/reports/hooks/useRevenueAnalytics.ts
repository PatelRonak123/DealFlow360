import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportsApi, RevenueAnalyticsResponse } from '../api/reportsApi';

export const reportsKeys = {
  all: ['reports'] as const,
  revenueAnalytics: () => [...reportsKeys.all, 'revenue-analytics'] as const,
};

export function useRevenueAnalytics() {
  return useQuery<RevenueAnalyticsResponse>({
    queryKey: reportsKeys.revenueAnalytics(),
    queryFn: () => reportsApi.getRevenueAnalytics(),
    staleTime: 1000 * 60, // 1 minute fresh
    placeholderData: keepPreviousData,
  });
}
