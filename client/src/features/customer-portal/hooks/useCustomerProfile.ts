import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';
import { CustomerProfile } from '../types';

export const getCustomerProfileQueryKey = (userEmail?: string) =>
  ['customer-portal', 'profile', userEmail ? userEmail.trim().toLowerCase() : 'current'] as const;

export function useCustomerProfile(options?: { userEmail?: string; enabled?: boolean }) {
  const email = options?.userEmail?.trim().toLowerCase();
  return useQuery({
    queryKey: getCustomerProfileQueryKey(email),
    queryFn: () => customerPortalApi.getProfile(),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30, // 30s fresh time for profile
  });
}

export function useUpdateCustomerProfile(userEmail?: string) {
  const queryClient = useQueryClient();
  const email = userEmail?.trim().toLowerCase();

  return useMutation({
    mutationFn: (data: Partial<CustomerProfile>) => customerPortalApi.updateProfile(data),
    onSuccess: (updated) => {
      const targetEmail = updated.email ? updated.email.trim().toLowerCase() : email;
      queryClient.setQueryData(getCustomerProfileQueryKey(targetEmail), updated);
      queryClient.invalidateQueries({ queryKey: ['customer-portal', 'profile'] });
    },
  });
}
