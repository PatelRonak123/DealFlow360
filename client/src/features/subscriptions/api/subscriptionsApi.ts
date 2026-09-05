import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';

export interface SubscriptionItem {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  tierName: string;
  planName: string;
  status: 'ACTIVE' | 'PENDING_RENEWAL' | 'PAST_DUE' | 'CANCELLED';
  recurringAmount: number;
  currency: string;
  billingFrequency: 'MONTHLY' | 'ANNUAL';
  arr: number;
  mrr: number;
  startDate: string;
  renewalDate: string;
  daysUntilRenewal: number;
  autoRenew: boolean;
  slaTier: 'Enterprise 99.99%' | 'Business 99.9%' | 'Standard 99.5%';
  assignedRepName: string;
  features: string[];
}

export interface SubscriptionsSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalArr: number;
  totalMrr: number;
  pendingRenewalsCount: number;
  pastDueCount: number;
  averageArr: number;
  netRetentionRate: number;
}

export interface SubscriptionsQueryParams {
  status?: string;
  search?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export const subscriptionsApi = {
  getSubscriptions: async (params?: SubscriptionsQueryParams): Promise<{
    items: SubscriptionItem[];
    summary: SubscriptionsSummary;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get<
      ApiResponse<{
        items: SubscriptionItem[];
        summary: SubscriptionsSummary;
      }>
    >('/subscriptions', { params });

    const meta = response.data.meta;
    return {
      items: response.data.data?.items || [],
      summary: response.data.data?.summary || {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalArr: 0,
        totalMrr: 0,
        pendingRenewalsCount: 0,
        pastDueCount: 0,
        averageArr: 0,
        netRetentionRate: 0,
      },
      total: meta?.total || (response.data.data?.items ? response.data.data.items.length : 0),
      page: meta?.page || 1,
      limit: meta?.limit || 20,
      totalPages: (meta as { totalPages?: number })?.totalPages || 1,
    };
  },

  getSubscriptionById: async (id: string): Promise<SubscriptionItem> => {
    const response = await apiClient.get<ApiResponse<SubscriptionItem>>(`/subscriptions/${id}`);
    return response.data.data!;
  },

  renewSubscription: async (id: string, notes?: string): Promise<SubscriptionItem> => {
    const response = await apiClient.post<ApiResponse<SubscriptionItem>>(`/subscriptions/${id}/renew`, {
      notes,
    });
    return response.data.data!;
  },

  cancelSubscription: async (id: string, reason?: string): Promise<SubscriptionItem> => {
    const response = await apiClient.post<ApiResponse<SubscriptionItem>>(`/subscriptions/${id}/cancel`, {
      reason,
    });
    return response.data.data!;
  },
};
