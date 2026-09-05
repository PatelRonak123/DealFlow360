import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';

export const CUSTOMER_SUBSCRIPTIONS_QUERY_KEY = ['customer-portal', 'subscriptions'] as const;

export function useSubscriptions() {
  return useQuery({
    queryKey: CUSTOMER_SUBSCRIPTIONS_QUERY_KEY,
    queryFn: () => customerPortalApi.getSubscriptions(),
  });
}

export function useSubscription(id: string) {
  return useQuery({
    queryKey: ['customer-portal', 'subscriptions', id],
    queryFn: () => customerPortalApi.getSubscriptionById(id),
    enabled: Boolean(id),
  });
}
