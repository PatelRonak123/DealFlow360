import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';

export const CUSTOMER_DASHBOARD_QUERY_KEY = ['customer-portal', 'dashboard'] as const;

export function useCustomerDashboard() {
  return useQuery({
    queryKey: CUSTOMER_DASHBOARD_QUERY_KEY,
    queryFn: () => customerPortalApi.getDashboard(),
  });
}
