import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  subscriptionsApi,
  SubscriptionsQueryParams,
} from '../api/subscriptionsApi';

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (params?: SubscriptionsQueryParams) => [...subscriptionKeys.lists(), params] as const,
  detail: (id: string) => [...subscriptionKeys.all, 'detail', id] as const,
};

export function useSubscriptionsList(params?: SubscriptionsQueryParams) {
  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: () => subscriptionsApi.getSubscriptions(params),
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}

export function useRenewSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      subscriptionsApi.renewSubscription(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      toast.success(`Subscription ${data.subscriptionNumber} renewed for another term!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to renew subscription');
    },
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      subscriptionsApi.cancelSubscription(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      toast.error(`Subscription ${data.subscriptionNumber} has been terminated.`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to cancel subscription');
    },
  });
}
