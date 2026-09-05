import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import { AppNotification } from '../types';

export const APP_NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useAppNotifications(activeRole?: string) {
  const queryClient = useQueryClient();

  const queryKey = [APP_NOTIFICATIONS_QUERY_KEY[0], activeRole];

  const query = useQuery<AppNotification[]>({
    queryKey,
    queryFn: () => notificationsApi.getNotifications(activeRole),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APP_NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['customer-portal', 'notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: (ids?: string[]) => notificationsApi.markAllNotificationsRead(ids, activeRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APP_NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['customer-portal', 'notifications'] });
    },
  });

  const notifications = query.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    ...query,
    notifications,
    unreadCount,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: () => markAllReadMutation.mutate(notifications.filter((n) => !n.isRead).map((n) => n.id)),
    isMarkingRead: markReadMutation.isPending || markAllReadMutation.isPending,
  };
}
