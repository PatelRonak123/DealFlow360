import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import { AppNotification } from '../types';

export const notificationsApi = {
  getNotifications: async (role?: string): Promise<AppNotification[]> => {
    const response = await apiClient.get<ApiResponse<AppNotification[]>>('/notifications', {
      params: role ? { role } : undefined,
    });
    return response.data.data || [];
  },

  markNotificationRead: async (id: string): Promise<boolean> => {
    const response = await apiClient.patch<ApiResponse<{ success: boolean }>>(`/notifications/${id}/read`);
    return response.data.data?.success ?? true;
  },

  markAllNotificationsRead: async (ids?: string[], role?: string): Promise<boolean> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      '/notifications/mark-all-read',
      { ids },
      { params: role ? { role } : undefined }
    );
    return response.data.data?.success ?? true;
  },
};
