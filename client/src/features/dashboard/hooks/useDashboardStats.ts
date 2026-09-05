// TEMP: computed from local store — replace with API call once 
// GET /api/v1/dashboard/sales-rep exists

import { useMemo } from 'react';
import { useQuotationsList } from '@/features/quotations/hooks/useQuotationsQuery';
import { BackendQuotation } from '@/features/quotations/types/quotationApi.types';
import { formatCompactINR } from '@/utils/formatters';

export interface DashboardStageMetric {
  stage: string;
  dealsCount: number;
  value: number;
  color: string;
}

export interface DashboardAccountMetric {
  name: string;
  tier: string;
  quotes: number;
  value: number;
}

export interface DashboardStats {
  totalPipeline: number;
  formattedPipeline: string;
  pipelineDelta: string;
  activeQuotesCount: number;
  totalQuotesCount: number;
  pendingApprovalsCount: number;
  averageDealMargin: number;
  formattedAverageMargin: string;
  marginSubtext: string;
  marginTrend: 'up' | 'warning' | 'neutral';
  attentionQuotes: BackendQuotation[];
  recentActiveQuotes: BackendQuotation[];
  stageBreakdown: DashboardStageMetric[];
  topAccounts: DashboardAccountMetric[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useDashboardStats(): DashboardStats {
  const { data: quoteData, isLoading, error, refetch } = useQuotationsList({ limit: 50 });
  const quotations = quoteData?.items || [];

  return useMemo(() => {
    // 1. Active Quotations filter (exclude Closed/Terminal statuses: CANCELLED, EXPIRED, REJECTED, LOST, WON, CONFIRMED, ORDERED)
    const activeQuotes = quotations.filter(
      (q) =>
        q.status !== 'CANCELLED' &&
        q.status !== 'EXPIRED' &&
        q.status !== 'REJECTED' &&
        q.status !== 'LOST' &&
        q.status !== 'WON' &&
        q.status !== 'CONFIRMED' &&
        q.status !== 'ORDERED'
    );

    const activeQuotesCount = activeQuotes.length;
    const totalQuotesCount = quoteData?.total || quotations.length;

    // 2. Pipeline Value (sum of active quotation net amounts)
    const totalPipeline = activeQuotes.reduce(
      (acc, q) => acc + (parseFloat(String(q.totalAmount)) || 0),
      0
    );

    // Dynamic pipeline comparison (quotes created in last 30 days vs prior period)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentQuotes = activeQuotes.filter(
      (q) => new Date(q.createdAt || q.issueDate).getTime() >= thirtyDaysAgo
    );
    const olderQuotes = activeQuotes.filter(
      (q) => new Date(q.createdAt || q.issueDate).getTime() < thirtyDaysAgo
    );

    const recentValue = recentQuotes.reduce(
      (acc, q) => acc + (parseFloat(String(q.totalAmount)) || 0),
      0
    );
    const olderValue = olderQuotes.reduce(
      (acc, q) => acc + (parseFloat(String(q.totalAmount)) || 0),
      0
    );

    let pipelineDelta = `${activeQuotesCount} active opportunities`;
    if (olderValue > 0) {
      const pctChange = Math.round(((recentValue - olderValue) / olderValue) * 100);
      pipelineDelta = `${pctChange >= 0 ? '+' : ''}${pctChange}% vs prior period`;
    } else if (activeQuotesCount > 0) {
      pipelineDelta = `${activeQuotesCount} active deals in flight`;
    }

    // 3. Pending Approvals count (all approval gating tiers)
    const pendingApprovalsCount = quotations.filter(
      (q) =>
        q.status === 'PENDING_APPROVAL' ||
        q.status === 'PENDING_MANAGER_APPROVAL' ||
        q.status === 'PENDING_FINANCE_APPROVAL'
    ).length;

    // 4. Average Deal Margin (calculated dynamically from actual quotations and discount levels)
    // CPQ Standard: Catalog standard base markup has target ~40% gross margin (cost ~60% of base).
    // Deal Gross Margin % = (Net Amount - Estimated Base Cost) / Net Amount * 100
    const activeWithAmounts = activeQuotes.filter(
      (q) => (parseFloat(String(q.totalAmount)) || 0) > 0
    );

    let averageDealMargin = 34.0; // Standard fallback
    if (activeWithAmounts.length > 0) {
      const margins = activeWithAmounts.map((q) => {
        const gross =
          parseFloat(String(q.subtotal)) ||
          parseFloat(String(q.totalAmount)) + (parseFloat(String(q.discountAmount)) || 0);
        const net = parseFloat(String(q.totalAmount)) || 0;
        const estCost = gross * 0.6; // Standard base cost ratio
        const profit = net - estCost;
        return net > 0 ? (profit / net) * 100 : 0;
      });

      const avg = margins.reduce((s, m) => s + m, 0) / margins.length;
      averageDealMargin = Math.round(avg * 10) / 10;
    }

    const marginTrend: 'up' | 'warning' | 'neutral' =
      averageDealMargin >= 30 ? 'up' : averageDealMargin >= 20 ? 'warning' : 'neutral';

    const marginSubtext =
      averageDealMargin >= 30
        ? `Healthy (${averageDealMargin}% ≥ 30% floor)`
        : `Under standard 30% target floor`;

    // 5. Governance Attention Quotes (pending approval or with discounts requiring review)
    const attentionQuotes = quotations.filter(
      (q) =>
        q.status === 'PENDING_APPROVAL' ||
        q.status === 'PENDING_MANAGER_APPROVAL' ||
        q.status === 'PENDING_FINANCE_APPROVAL' ||
        q.status === 'NEGOTIATION' ||
        (parseFloat(String(q.discountAmount)) || 0) > 0
    );

    // 6. Recent Active Quotations: Limited to TOP 5, sorted descending by updatedAt/createdAt
    const recentActiveQuotes = [...activeQuotes]
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);

    // 7. Pipeline Velocity Breakdown by stage
    const draftQuotes = quotations.filter((q) => q.status === 'DRAFT');
    const reviewQuotes = quotations.filter(
      (q) =>
        q.status === 'PENDING_APPROVAL' ||
        q.status === 'PENDING_MANAGER_APPROVAL' ||
        q.status === 'PENDING_FINANCE_APPROVAL'
    );
    const approvedQuotes = quotations.filter((q) => q.status === 'APPROVED');
    const sentNegotiatingQuotes = quotations.filter(
      (q) => q.status === 'SENT' || q.status === 'NEGOTIATION'
    );
    const wonQuotes = quotations.filter(
      (q) => q.status === 'WON' || q.status === 'CONFIRMED'
    );

    const sumVal = (list: BackendQuotation[]) =>
      list.reduce((s, q) => s + (parseFloat(String(q.totalAmount)) || 0), 0);

    const stageBreakdown: DashboardStageMetric[] = [
      {
        stage: 'Draft Proposals',
        dealsCount: draftQuotes.length,
        value: sumVal(draftQuotes),
        color: 'bg-slate-400',
      },
      {
        stage: 'Approval Review',
        dealsCount: reviewQuotes.length,
        value: sumVal(reviewQuotes),
        color: 'bg-amber-500',
      },
      {
        stage: 'Approved Proposals',
        dealsCount: approvedQuotes.length,
        value: sumVal(approvedQuotes),
        color: 'bg-emerald-500',
      },
      {
        stage: 'Sent & Negotiating',
        dealsCount: sentNegotiatingQuotes.length,
        value: sumVal(sentNegotiatingQuotes),
        color: 'bg-purple-500',
      },
      {
        stage: 'Closed Won / Ordered',
        dealsCount: wonQuotes.length,
        value: sumVal(wonQuotes),
        color: 'bg-blue-600',
      },
    ];

    // 8. Top Accounts Managed
    const accountMap = new Map<string, DashboardAccountMetric>();
    quotations.forEach((q) => {
      const name = q.customer?.companyName || 'Enterprise Account';
      const tier = q.customer?.customerTier?.name || 'Standard Tier';
      const val = parseFloat(String(q.totalAmount)) || 0;
      if (!accountMap.has(name)) {
        accountMap.set(name, { name, tier, quotes: 1, value: val });
      } else {
        const item = accountMap.get(name)!;
        item.quotes += 1;
        item.value += val;
      }
    });

    const topAccounts = Array.from(accountMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    return {
      totalPipeline,
      formattedPipeline: formatCompactINR(totalPipeline),
      pipelineDelta,
      activeQuotesCount,
      totalQuotesCount,
      pendingApprovalsCount,
      averageDealMargin,
      formattedAverageMargin: `${averageDealMargin.toFixed(1)}%`,
      marginSubtext,
      marginTrend,
      attentionQuotes,
      recentActiveQuotes,
      stageBreakdown,
      topAccounts,
      isLoading,
      error,
      refetch,
    };
  }, [quotations, quoteData?.total, isLoading, error, refetch]);
}
