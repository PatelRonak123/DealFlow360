import React, { useMemo } from 'react';
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
import { useQuotationsList } from '@/features/quotations/hooks/useQuotationsQuery';
import { formatCompactINR, formatINR } from '@/utils/formatters';

export const SalesRepDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: quoteData } = useQuotationsList({ limit: 50 });
  const quotations = quoteData?.items || [];

  // Dynamic calculations from live quotations API
  const activeQuotes = quotations.filter(
    (q) => q.status !== 'CANCELLED' && q.status !== 'EXPIRED' && q.status !== 'REJECTED'
  );

  const totalPipeline = activeQuotes.reduce(
    (acc, q) => acc + (parseFloat(String(q.totalAmount)) || 0),
    0
  );

  const pendingApprovalsCount = quotations.filter(
    (q) => q.status === 'PENDING_MANAGER_APPROVAL' || q.status === 'PENDING_FINANCE_APPROVAL'
  ).length;

  const activeQuotesCount = activeQuotes.length;

  // Quotes requiring sales rep governance attention
  const attentionQuotes = quotations.filter(
    (q) =>
      q.status === 'PENDING_MANAGER_APPROVAL' ||
      q.status === 'PENDING_FINANCE_APPROVAL' ||
      (parseFloat(String(q.discountAmount)) || 0) > 0
  );

  // Pipeline velocity breakdown by stage
  const draftQuotes = quotations.filter((q) => q.status === 'DRAFT');
  const approvalQuotes = quotations.filter(
    (q) => q.status === 'PENDING_MANAGER_APPROVAL' || q.status === 'PENDING_FINANCE_APPROVAL'
  );
  const approvedQuotes = quotations.filter((q) => q.status === 'APPROVED');
  const sentQuotes = quotations.filter((q) => q.status === 'SENT');

  const stageBreakdown = [
    {
      stage: 'Draft Quotes',
      dealsCount: draftQuotes.length,
      value: draftQuotes.reduce((s, q) => s + (parseFloat(String(q.totalAmount)) || 0), 0),
      color: 'bg-slate-400',
    },
    {
      stage: 'Approval Review',
      dealsCount: approvalQuotes.length,
      value: approvalQuotes.reduce((s, q) => s + (parseFloat(String(q.totalAmount)) || 0), 0),
      color: 'bg-amber-500',
    },
    {
      stage: 'Approved Proposals',
      dealsCount: approvedQuotes.length,
      value: approvedQuotes.reduce((s, q) => s + (parseFloat(String(q.totalAmount)) || 0), 0),
      color: 'bg-emerald-500',
    },
    {
      stage: 'Sent to Customer',
      dealsCount: sentQuotes.length,
      value: sentQuotes.reduce((s, q) => s + (parseFloat(String(q.totalAmount)) || 0), 0),
      color: 'bg-purple-500',
    },
  ];

  // Top customer accounts from real quotations
  const topAccounts = useMemo(() => {
    const map = new Map<string, { name: string; tier: string; quotes: number; value: number }>();
    quotations.forEach((q) => {
      const name = q.customer?.companyName || 'Enterprise Customer';
      const tier = q.customer?.customerTier?.name || 'Standard';
      const val = parseFloat(String(q.totalAmount)) || 0;
      if (!map.has(name)) {
        map.set(name, { name, tier, quotes: 1, value: val });
      } else {
        const item = map.get(name)!;
        item.quotes += 1;
        item.value += val;
      }
    });
    return Array.from(map.values()).slice(0, 3);
  }, [quotations]);

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
      subtext: `${quoteData?.total || quotations.length} total quotations`,
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
      value: '34.2%',
      subtext: 'Target: > 30% gross margin',
      icon: Percent,
      trend: 'up',
      tone: 'emerald',
    },
  ];

  const toneStyles: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-[#edf4ff]', text: 'text-[#3568ed]' },
    indigo: { bg: 'bg-[#f1edff]', text: 'text-[#6366f1]' },
    amber: { bg: 'bg-[#fff8eb]', text: 'text-[#d97706]' },
    emerald: { bg: 'bg-[#ecfdf5]', text: 'text-[#059669]' },
  };

  const statusVariantMap: Record<
    string,
    'draft' | 'pending' | 'approved' | 'negotiating' | 'won' | 'rejected' | 'default'
  > = {
    DRAFT: 'draft',
    PENDING_MANAGER_APPROVAL: 'pending',
    PENDING_FINANCE_APPROVAL: 'pending',
    APPROVED: 'approved',
    SENT: 'negotiating',
    REJECTED: 'rejected',
    CANCELLED: 'rejected',
    EXPIRED: 'default',
  };

  const statusLabelMap: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_MANAGER_APPROVAL: 'Manager Review',
    PENDING_FINANCE_APPROVAL: 'Finance Review',
    APPROVED: 'Approved',
    SENT: 'Sent',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
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

      {/* Governance & Attention Banner */}
      {attentionQuotes.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-[#fffdfa] p-5 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {attentionQuotes.length} Quotation{attentionQuotes.length > 1 ? 's' : ''} Require Governance Attention
                </h3>
                <p className="mt-0.5 text-xs text-amber-700">
                  Proposals with pending discount approvals or custom commercial terms require review before client dispatch.
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
              Review Pipeline
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 border-t border-amber-100 pt-3">
            {attentionQuotes.slice(0, 3).map((quote) => (
              <div
                key={quote.id}
                onClick={() => navigate(`/quotations/${quote.id}`)}
                className="rounded-xl border border-amber-200/80 bg-white p-3 hover:border-amber-400 hover:shadow-xs transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17213a] truncate">
                    {quote.customer?.companyName || 'Enterprise Customer'}
                  </span>
                  <Badge
                    variant={quote.status === 'APPROVED' ? 'approved' : 'pending'}
                    size="sm"
                  >
                    {quote.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">
                  {quote.notes || quote.quotationNumber}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#3568ed]">
                  <span>{formatINR(parseFloat(String(quote.totalAmount)) || 0)}</span>
                  <span className="flex items-center gap-0.5">
                    Open Quote
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
                Live CPQ quotes retrieved from backend pricing and approval service
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
            {quotations.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No active quotations found. Create your first quote using the button above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#eef2f9] text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                      <th className="pb-3 font-semibold">Quote ID</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Total Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f5fb]">
                    {quotations.map((quote) => {
                      const totalNum = parseFloat(String(quote.totalAmount)) || 0;
                      const customerName = quote.customer?.companyName || 'Unassigned Customer';

                      return (
                        <tr
                          key={quote.id}
                          className="group hover:bg-[#f8faff] transition cursor-pointer"
                          onClick={() => navigate(`/quotations/${quote.id}`)}
                        >
                          <td className="py-3.5 font-bold text-[#3568ed]">
                            {quote.quotationNumber}
                          </td>
                          <td className="py-3.5">
                            <p className="font-semibold text-[#17213a]">{customerName}</p>
                            {quote.customer?.customerTier && (
                              <span className="text-[10px] text-gray-400">
                                Tier: {quote.customer.customerTier.name}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 font-bold text-[#17213a]">
                            {formatINR(totalNum)}
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
            )}
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
                {stageBreakdown.map((item) => (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#17213a]">{item.stage}</span>
                      <span className="font-bold text-[#3568ed]">{formatCompactINR(item.value)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{
                            width: `${totalPipeline > 0 ? Math.min(100, Math.max(8, (item.value / totalPipeline) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                        {item.dealsCount} quote{item.dealsCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-[#f8faff] border border-[#eef2fc] p-3.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold text-[#17213a]">Approval Flow Governed</p>
                </div>
                <p className="mt-1 text-[11px] text-[#71809f]">
                  Discounts adhering to customer tier rules are auto-approved. Manager or Finance review triggered when thresholds are exceeded.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Top Accounts Managed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Accounts Managed</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#3568ed]"
                onClick={() => navigate('/customers')}
              >
                View Accounts
              </Button>
            </CardHeader>
            <CardContent>
              {topAccounts.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  No account quotations created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {topAccounts.map((account) => (
                    <div
                      key={account.name}
                      className="flex items-center justify-between rounded-xl border border-[#eef2f9] p-3 hover:border-blue-200 hover:bg-[#fafbff] transition cursor-pointer"
                      onClick={() => navigate('/customers')}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed] shrink-0">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#17213a] truncate">{account.name}</p>
                          <span className="text-[10px] text-gray-400">Tier: {account.tier}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#17213a]">{formatCompactINR(account.value)}</p>
                        <span className="text-[10px] text-blue-600 font-medium">
                          {account.quotes} quote{account.quotes === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
