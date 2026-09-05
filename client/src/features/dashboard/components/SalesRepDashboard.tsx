import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  IndianRupee,
  Clock,
  Percent,
  PlusCircle,
  Kanban,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth';
import { useQuotations } from '@/features/quotations/store/quotationStore';
import { useDeals } from '@/features/deals/store/dealStore';
import { formatCompactINR, formatINR, formatPercent } from '@/utils/formatters';

export const SalesRepDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quotations } = useQuotations();
  const { deals } = useDeals();

  // Dynamic calculations from stores
  const totalPipeline = deals
    .filter((d) => d.stage !== 'closed_lost')
    .reduce((acc, d) => acc + d.amount, 0);

  const pendingApprovalsCount = quotations.filter(
    (q) => q.status === 'pending_approval' || q.status === 'under_reapproval'
  ).length;

  const activeQuotesCount = quotations.filter(
    (q) => q.status !== 'closed_won' && q.status !== 'rejected'
  ).length;

  const averageMargin =
    quotations.length > 0
      ? quotations.reduce((acc, q) => acc + q.grossMarginPercent, 0) / quotations.length
      : 0;

  // Stalled or risky deals
  const riskyDeals = deals.filter((d) => d.health !== 'healthy');

  const metrics = [
    {
      label: 'My Pipeline Value',
      value: formatCompactINR(totalPipeline),
      subtext: '+14% vs last month',
      icon: IndianRupee,
      trend: 'up',
      tone: 'blue',
    },
    {
      label: 'Active Quotations',
      value: activeQuotesCount.toString(),
      subtext: `${quotations.length} total generated`,
      icon: FileText,
      trend: 'up',
      tone: 'indigo',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovalsCount.toString(),
      subtext: 'In review by Manager/Finance',
      icon: Clock,
      trend: pendingApprovalsCount > 0 ? 'warning' : 'neutral',
      tone: 'amber',
    },
    {
      label: 'Average Deal Margin',
      value: formatPercent(averageMargin),
      subtext: 'Target: > 30% gross margin',
      icon: Percent,
      trend: averageMargin >= 30 ? 'up' : 'down',
      tone: 'emerald',
    },
  ];

  const toneStyles: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-[#edf4ff]', text: 'text-[#3568ed]' },
    indigo: { bg: 'bg-[#f1edff]', text: 'text-[#6366f1]' },
    amber: { bg: 'bg-[#fff8eb]', text: 'text-[#d97706]' },
    emerald: { bg: 'bg-[#ecfdf5]', text: 'text-[#059669]' },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner with Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#3568ed] border border-blue-200">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              Sales Representative Workspace
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17213a] sm:text-3xl">
            Welcome back, {user.name}!
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Here is your live deals velocity, approval governance status, and quotation pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Kanban className="h-4 w-4" />}
            onClick={() => navigate('/pipeline')}
          >
            View Pipeline
          </Button>
          <Button
            variant="primary"
            leftIcon={<PlusCircle className="h-4 w-4" />}
            onClick={() => navigate('/quotations/new')}
          >
            Create New Quote
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, subtext, icon: Icon, tone }) => {
          const style = toneStyles[tone];
          return (
            <div
              key={label}
              className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-[0_8px_24px_rgba(64,86,145,0.05)] transition-all hover:border-[#cad7f5]"
            >
              <div className="flex items-start justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#17213a]">{value}</span>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#71809f]">{label}</p>
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#475467]">
                <TrendingUp className="h-3 w-3 text-[#3568ed]" />
                {subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Deal Health & Action Alert Banner */}
      {riskyDeals.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-[#fffdfa] p-5 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {riskyDeals.length} Deals Require Sales Rep Action
                </h3>
                <p className="mt-0.5 text-xs text-amber-700">
                  Deals with discount anomalies, stalled customer contact, or fulfillment bottlenecks need attention.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 bg-white text-amber-900 hover:bg-amber-50"
              onClick={() => navigate('/pipeline')}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Review Risky Deals
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 border-t border-amber-100 pt-3">
            {riskyDeals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => deal.quoteId ? navigate(`/quotations/${deal.quoteId}`) : navigate('/pipeline')}
                className="rounded-xl border border-amber-200/80 bg-white p-3 hover:border-amber-400 hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17213a] truncate">{deal.customerName}</span>
                  <Badge variant={deal.health === 'stalled' ? 'warning' : 'danger'} size="sm">
                    {deal.health.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">{deal.healthReason}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#3568ed]">
                  <span>{formatINR(deal.amount)}</span>
                  <span className="flex items-center gap-0.5">
                    {deal.quoteId ? `View ${deal.quoteId}` : 'Open Deal'}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Split: Active Quotations & Pipeline Stages */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        {/* Recent Quotations Table Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>My Active Quotations</CardTitle>
              <p className="mt-0.5 text-xs text-[#71809f]">
                Live CPQ quotes across review, customer negotiation, and fulfillment
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/quotations')}
              rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
            >
              View All Quotes
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="pb-3 font-semibold">Quote ID</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Net Value</th>
                    <th className="pb-3 font-semibold">Margin %</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {quotations.map((quote) => {
                    const statusVariantMap: Record<string, 'draft' | 'pending' | 'approved' | 'negotiating' | 'won' | 'rejected'> = {
                      draft: 'draft',
                      pending_approval: 'pending',
                      approved: 'approved',
                      in_negotiation: 'negotiating',
                      under_reapproval: 'pending',
                      closed_won: 'won',
                      rejected: 'rejected',
                    };

                    const statusLabelMap: Record<string, string> = {
                      draft: 'Draft',
                      pending_approval: 'Pending Approval',
                      approved: 'Approved',
                      in_negotiation: 'In Negotiation',
                      under_reapproval: 'Re-Approval Req.',
                      closed_won: 'Closed Won',
                      rejected: 'Rejected',
                    };

                    return (
                      <tr
                        key={quote.id}
                        className="group hover:bg-[#f8faff] transition cursor-pointer"
                        onClick={() => navigate(`/quotations/${quote.id}`)}
                      >
                        <td className="py-3.5 font-bold text-[#3568ed]">
                          {quote.id}
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-[#17213a]">{quote.customerName}</p>
                          <span className="text-[10px] text-gray-400">Tier: {quote.customerTier}</span>
                        </td>
                        <td className="py-3.5 font-bold text-[#17213a]">
                          {formatINR(quote.netTotal)}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`font-semibold ${
                              quote.grossMarginPercent >= 30
                                ? 'text-emerald-600'
                                : quote.grossMarginPercent >= 20
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatPercent(quote.grossMarginPercent)}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <Badge variant={statusVariantMap[quote.status] || 'default'} size="sm">
                            {statusLabelMap[quote.status] || quote.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/quotations/${quote.id}`);
                            }}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-[#3568ed] transition"
                            title="Open Quote Details"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Health & Stages Snapshot */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Deal Pipeline Velocity</CardTitle>
                <p className="mt-0.5 text-xs text-[#71809f]">Active pipeline by sales stage</p>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {[
                  { stage: 'Discovery / Lead', dealsCount: 1, value: 640000, color: 'bg-slate-400' },
                  { stage: 'Proposal / Quote', dealsCount: 2, value: 3730000, color: 'bg-blue-500' },
                  { stage: 'Customer Negotiation', dealsCount: 1, value: 1805000, color: 'bg-purple-500' },
                  { stage: 'Closed Won', dealsCount: 1, value: 310000, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#17213a]">{item.stage}</span>
                      <span className="font-bold text-[#3568ed]">{formatCompactINR(item.value)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${Math.min(100, Math.max(15, (item.value / totalPipeline) * 100))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                        {item.dealsCount} deal
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-[#f8faff] border border-[#eef2fc] p-3.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold text-[#17213a]">Win Rate: 68%</p>
                </div>
                <p className="mt-1 text-[11px] text-[#71809f]">
                  Above the 60% quarterly target. Keep high-margin quotes in review to avoid discount slippage.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Account Links */}
          <Card>
            <CardHeader>
              <CardTitle>Top Accounts Managed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Tata Consultancy Services', tier: 'Gold', quotes: 1, value: '₹ 24.5 L' },
                  { name: 'Infosys FinTech Solutions', tier: 'Gold', quotes: 1, value: '₹ 18.0 L' },
                  { name: 'Bharat Logistics', tier: 'Silver', quotes: 1, value: '₹ 12.8 L' },
                ].map((account) => (
                  <div
                    key={account.name}
                    className="flex items-center justify-between rounded-xl border border-[#eef2f9] p-3 hover:border-blue-200 hover:bg-[#fafbff] transition cursor-pointer"
                    onClick={() => navigate('/customers')}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#17213a]">{account.name}</p>
                        <span className="text-[10px] text-gray-400">Tier: {account.tier}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#17213a]">{account.value}</p>
                      <span className="text-[10px] text-blue-600 font-medium">{account.quotes} quote</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
