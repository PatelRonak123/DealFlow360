import { db } from '../../../database/db.js';
import { customers, quotations } from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
import {
  SubscriptionItem,
  SubscriptionsSummary,
  SubscriptionsListResult,
  SubscriptionsQueryInput,
} from '../types/index.js';
import { NotFoundError } from '../../../common/errors/index.js';

class SubscriptionsService {
  private subscriptionStore: Map<string, SubscriptionItem> = new Map();
  private initialized = false;

  private async initializeFromDb(): Promise<void> {
    if (this.initialized && this.subscriptionStore.size > 0) return;

    // Fetch real customers from database
    const dbCustomers = await db.query.customers.findMany({
      with: {
        customerTier: true,
      },
    });

    const now = new Date();
    const plans = [
      {
        planName: 'Enterprise SaaS Governance Cloud',
        basePrice: 180000,
        frequency: 'ANNUAL' as const,
        sla: 'Enterprise 99.99%' as const,
        features: ['Unlimited Quotes & Approvals', 'Multi-Level Discount Governance', 'Dedicated Logistics Dispatch', '24/7 Priority Hotline'],
      },
      {
        planName: 'DealFlow360 Growth CPQ Suite',
        basePrice: 75000,
        frequency: 'ANNUAL' as const,
        sla: 'Business 99.9%' as const,
        features: ['CPQ Rule Engine', 'Automated Pricing & Tier Discounts', 'Warehouse Allocation Automation'],
      },
      {
        planName: 'Cloud Revenue Operations Pro',
        basePrice: 12000,
        frequency: 'MONTHLY' as const,
        sla: 'Business 99.9%' as const,
        features: ['Pipeline Health Tracking', 'Automated Invoicing & Collections', 'Standard Fulfillment Integration'],
      },
      {
        planName: 'Commerce Core & Logistics Tier',
        basePrice: 240000,
        frequency: 'ANNUAL' as const,
        sla: 'Enterprise 99.99%' as const,
        features: ['Full Logistics Dispatch Hub', 'Multi-Warehouse Allocation', 'Carrier Manifest Automation', 'Executive SLA Assurance'],
      },
    ];

    let index = 1;
    for (const cust of dbCustomers) {
      const planIndex = (index - 1) % plans.length;
      const selectedPlan = plans[planIndex];
      const tierName = (cust as any).customerTier?.name || 'Gold Tier';

      // Vary start dates and renewal dates
      const startMonthsAgo = (index * 2) % 11 + 1;
      const startDate = new Date(now.getFullYear(), now.getMonth() - startMonthsAgo, 15);
      
      // Renewal date
      const renewalMonthsLater = 12 - startMonthsAgo;
      const renewalDate = new Date(now.getFullYear(), now.getMonth() + renewalMonthsLater, 15);
      const diffMs = renewalDate.getTime() - now.getTime();
      const daysUntilRenewal = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: 'ACTIVE' | 'PENDING_RENEWAL' | 'PAST_DUE' | 'CANCELLED' = 'ACTIVE';
      if (daysUntilRenewal <= 30 && daysUntilRenewal > 0) {
        status = 'PENDING_RENEWAL';
      } else if (daysUntilRenewal <= 0) {
        status = 'PAST_DUE';
      }

      // Calculate ARR and MRR
      const isAnnual = selectedPlan.frequency === 'ANNUAL';
      const recurringAmount = selectedPlan.basePrice;
      const arr = isAnnual ? recurringAmount : recurringAmount * 12;
      const mrr = isAnnual ? Math.round(recurringAmount / 12) : recurringAmount;

      const subId = `sub-${cust.id.slice(0, 8)}`;
      const subNumber = `SUB-${String(202600 + index).padStart(6, '0')}`;

      this.subscriptionStore.set(subId, {
        id: subId,
        subscriptionNumber: subNumber,
        customerId: cust.id,
        customerName: cust.companyName,
        customerEmail: cust.email,
        tierName,
        planName: selectedPlan.planName,
        status,
        recurringAmount,
        currency: 'INR',
        billingFrequency: selectedPlan.frequency,
        arr,
        mrr,
        startDate: startDate.toISOString(),
        renewalDate: renewalDate.toISOString(),
        daysUntilRenewal,
        autoRenew: index % 4 !== 0,
        slaTier: selectedPlan.sla,
        assignedRepName: 'Priya Sharma (Enterprise AE)',
        features: selectedPlan.features,
      });

      index++;
    }

    this.initialized = true;
  }

  public async listSubscriptions(query: SubscriptionsQueryInput): Promise<SubscriptionsListResult> {
    await this.initializeFromDb();

    let all = Array.from(this.subscriptionStore.values());

    // Filter by status
    if (query.status && query.status !== 'all') {
      const targetStatus = query.status.toUpperCase();
      all = all.filter((s) => s.status === targetStatus);
    }

    // Filter by search query (customer name, email, subscription number, plan name)
    if (query.search) {
      const q = query.search.toLowerCase().trim();
      all = all.filter(
        (s) =>
          s.customerName.toLowerCase().includes(q) ||
          s.customerEmail.toLowerCase().includes(q) ||
          s.subscriptionNumber.toLowerCase().includes(q) ||
          s.planName.toLowerCase().includes(q)
      );
    }

    // Filter by customerId
    if (query.customerId) {
      all = all.filter((s) => s.customerId === query.customerId);
    }

    // Sort: Pending renewals first, then active, then earliest renewal
    all.sort((a, b) => {
      if (a.status === 'PENDING_RENEWAL' && b.status !== 'PENDING_RENEWAL') return -1;
      if (b.status === 'PENDING_RENEWAL' && a.status !== 'PENDING_RENEWAL') return 1;
      return a.daysUntilRenewal - b.daysUntilRenewal;
    });

    // Compute Executive Summary Metrics
    const allStoreItems = Array.from(this.subscriptionStore.values());
    const totalSubscriptions = allStoreItems.length;
    const activeItems = allStoreItems.filter((s) => s.status === 'ACTIVE' || s.status === 'PENDING_RENEWAL');
    const activeSubscriptions = activeItems.length;
    const totalArr = activeItems.reduce((sum, s) => sum + s.arr, 0);
    const totalMrr = activeItems.reduce((sum, s) => sum + s.mrr, 0);
    const pendingRenewalsCount = allStoreItems.filter((s) => s.status === 'PENDING_RENEWAL').length;
    const pastDueCount = allStoreItems.filter((s) => s.status === 'PAST_DUE').length;
    const averageArr = activeSubscriptions > 0 ? Math.round(totalArr / activeSubscriptions) : 0;
    const netRetentionRate = 114.5; // Benchmark SaaS NRR 114.5%

    const summary: SubscriptionsSummary = {
      totalSubscriptions,
      activeSubscriptions,
      totalArr,
      totalMrr,
      pendingRenewalsCount,
      pastDueCount,
      averageArr,
      netRetentionRate,
    };

    // Pagination
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const total = all.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const items = all.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      summary,
    };
  }

  public async getSubscriptionById(id: string): Promise<SubscriptionItem> {
    await this.initializeFromDb();
    const item = this.subscriptionStore.get(id);
    if (!item) {
      throw new NotFoundError(`Subscription with ID '${id}' was not found`);
    }
    return item;
  }

  public async renewSubscription(id: string, notes?: string): Promise<SubscriptionItem> {
    const item = await this.getSubscriptionById(id);
    const currentRenewal = new Date(item.renewalDate);
    const nextRenewal = new Date(
      currentRenewal.getFullYear() + (item.billingFrequency === 'ANNUAL' ? 1 : 0),
      currentRenewal.getMonth() + (item.billingFrequency === 'MONTHLY' ? 1 : 0),
      currentRenewal.getDate()
    );

    const now = new Date();
    const diffMs = nextRenewal.getTime() - now.getTime();
    const daysUntilRenewal = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const updated: SubscriptionItem = {
      ...item,
      status: 'ACTIVE',
      renewalDate: nextRenewal.toISOString(),
      daysUntilRenewal,
    };

    this.subscriptionStore.set(id, updated);
    return updated;
  }

  public async cancelSubscription(id: string, reason?: string): Promise<SubscriptionItem> {
    const item = await this.getSubscriptionById(id);
    const updated: SubscriptionItem = {
      ...item,
      status: 'CANCELLED',
      autoRenew: false,
    };

    this.subscriptionStore.set(id, updated);
    return updated;
  }
}

export const subscriptionsService = new SubscriptionsService();
