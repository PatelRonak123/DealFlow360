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

export interface SubscriptionsListResult {
  items: SubscriptionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: SubscriptionsSummary;
}

export interface SubscriptionsQueryInput {
  status?: string;
  search?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}
