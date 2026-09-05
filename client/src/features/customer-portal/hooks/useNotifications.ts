import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';

export const CUSTOMER_NOTIFICATIONS_QUERY_KEY = ['customer-portal', 'notifications'] as const;

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CUSTOMER_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => customerPortalApi.getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => customerPortalApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_NOTIFICATIONS_QUERY_KEY });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => customerPortalApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_NOTIFICATIONS_QUERY_KEY });
    },
  });

  return {
    ...query,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending || markAllReadMutation.isPending,
  };
}
