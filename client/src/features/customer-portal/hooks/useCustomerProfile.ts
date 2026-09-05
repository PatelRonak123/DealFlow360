import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';
import { CustomerProfile } from '../types';

export const CUSTOMER_PROFILE_QUERY_KEY = ['customer-portal', 'profile'] as const;

export function useCustomerProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: CUSTOMER_PROFILE_QUERY_KEY,
    queryFn: () => customerPortalApi.getProfile(),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CustomerProfile>) => customerPortalApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(CUSTOMER_PROFILE_QUERY_KEY, updated);
      queryClient.invalidateQueries({ queryKey: CUSTOMER_PROFILE_QUERY_KEY });
    },
  });
}
