import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShieldCheck,
  Receipt,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth';
import { useFinanceDashboard } from '../hooks/useFinance';
import { formatINR } from '@/utils/formatters';

export const FinanceDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useFinanceDashboard();

  const overview = data?.overview || {
    pendingFinanceApprovals: 0,
    pendingFinanceValue: 0,
    approvedDealsCount: 0,
    rejectedDealsCount: 0,
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueAmount: 0,
    pendingInvoicesCount: 0,
    paidInvoicesCount: 0,
    overdueInvoicesCount: 0,
    activeSubscriptionPlans: 0,
  };

  const arAging = data?.arAging || {
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
  };

  const totalAr = overview.totalOutstanding || 1;
  const currentPct = Math.min(100, Math.round((arAging.current / totalAr) * 100)) || 0;
  const days30to60Pct = Math.min(100, Math.round((arAging.days31to60 / totalAr) * 100)) || 0;
  const days60to90Pct = Math.min(100, Math.round((arAging.days61to90 / totalAr) * 100)) || 0;
  const over90Pct = Math.min(100, Math.round((arAging.over90 / totalAr) * 100)) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <DollarSign className="h-3.5 w-3.5" /> Commercial Finance &amp; Revenue Operations
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17213a]">
            Welcome back, {user?.name || 'Finance Officer'}!
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Enterprise margin controls, tier-2 risk signoffs, tax invoicing schedules, and collections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            leftIcon={<ShieldCheck className="h-4 w-4" />}
            onClick={() => navigate('/finance/approvals')}
          >
            Approvals Queue ({overview.pendingFinanceApprovals})
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Total AR Outstanding</p>
              <p className="text-xl font-bold text-[#17213a]">{formatINR(overview.totalOutstanding)}</p>
              <p className="text-[11px] text-emerald-600 font-medium">
                {overview.totalCollected > 0 ? `${formatINR(overview.totalCollected)} collected` : 'Active collections'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Tier-2 Approvals</p>
              <p className="text-xl font-bold text-[#17213a]">
                {overview.pendingFinanceApprovals} {overview.pendingFinanceApprovals === 1 ? 'Deal' : 'Deals'}
              </p>
              <p className="text-[11px] text-purple-600 font-medium">
                {formatINR(overview.pendingFinanceValue)} pending signoff
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Invoiced Total</p>
              <p className="text-xl font-bold text-[#17213a]">{formatINR(overview.totalInvoiced)}</p>
              <p className="text-[11px] text-blue-600 font-medium">
                {overview.paidInvoicesCount} paid / {overview.pendingInvoicesCount} pending
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Margin Policy</p>
              <p className="text-xl font-bold text-[#17213a]">20.0% Floor</p>
              <p className="text-[11px] text-amber-600 font-medium">Governance enforced</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Accounts Receivable Aging & Quick Action Workflows */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* AR Aging Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Accounts Receivable (AR) Aging Breakdown</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Real-time invoice balance distribution by due date maturity.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/finance/invoices')}
            >
              View Invoices
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Stacked Progress Bar */}
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 flex shadow-inner">
              <div style={{ width: `${currentPct}%` }} className="bg-emerald-500 h-full" title={`Current: ${formatINR(arAging.current)}`} />
              <div style={{ width: `${days30to60Pct}%` }} className="bg-amber-400 h-full" title={`31-60 Days: ${formatINR(arAging.days31to60)}`} />
              <div style={{ width: `${days60to90Pct}%` }} className="bg-orange-500 h-full" title={`61-90 Days: ${formatINR(arAging.days61to90)}`} />
              <div style={{ width: `${over90Pct}%` }} className="bg-rose-500 h-full" title={`>90 Days: ${formatINR(arAging.over90)}`} />
            </div>

            {/* Buckets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Current (&lt; 30d)</span>
                </div>
                <p className="text-base font-bold text-[#17213a]">{formatINR(arAging.current)}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{currentPct}% of AR</p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold mb-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>31 – 60 Days</span>
                </div>
                <p className="text-base font-bold text-[#17213a]">{formatINR(arAging.days31to60)}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{days30to60Pct}% of AR</p>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-orange-700 font-bold mb-1">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  <span>61 – 90 Days</span>
                </div>
                <p className="text-base font-bold text-[#17213a]">{formatINR(arAging.days61to90)}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{days60to90Pct}% of AR</p>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold mb-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>&gt; 90 Days</span>
                </div>
                <p className="text-base font-bold text-[#17213a]">{formatINR(arAging.over90)}</p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{over90Pct}% of AR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Action Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Finance Workflows</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/finance/approvals')}
              className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-purple-50/50 hover:border-purple-200 transition text-left cursor-pointer group"
            >
              <div>
                <p className="text-sm font-bold text-[#17213a] group-hover:text-purple-700 transition">
                  High-Risk Deal Signoffs
                </p>
                <p className="text-xs text-gray-500">Tier-2 discount &amp; margin approvals</p>
              </div>
              <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/finance/invoices')}
              className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-emerald-50/50 hover:border-emerald-200 transition text-left cursor-pointer group"
            >
              <div>
                <p className="text-sm font-bold text-[#17213a] group-hover:text-emerald-700 transition">
                  Invoices &amp; Collections
                </p>
                <p className="text-xs text-gray-500">Commercial billing &amp; GST tax invoices</p>
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/finance/payments')}
              className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-200 transition text-left cursor-pointer group"
            >
              <div>
                <p className="text-sm font-bold text-[#17213a] group-hover:text-blue-700 transition">
                  Record Payments
                </p>
                <p className="text-xs text-gray-500">Bank transfers, NEFT, and credit ledger</p>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/finance/subscriptions')}
              className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-amber-50/50 hover:border-amber-200 transition text-left cursor-pointer group"
            >
              <div>
                <p className="text-sm font-bold text-[#17213a] group-hover:text-amber-700 transition">
                  Subscription Contracts &amp; ARR
                </p>
                <p className="text-xs text-gray-500">Recurring revenue &amp; renewals</p>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-600 group-hover:translate-x-0.5 transition" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Approvals & Recent Invoices Double Column */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Finance Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Recent Finance Signoffs</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/finance/approvals')}
            >
              View All ({overview.pendingFinanceApprovals})
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data?.recentApprovals?.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No recent finance approvals recorded.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {data?.recentApprovals?.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/finance/approvals/${item.id}`)}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-[#17213a]">
                        {item.quotation?.quotationNumber || 'Quotation'}
                      </p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        {item.customer?.companyName || 'Customer Account'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#17213a]">
                        {formatINR(parseFloat(item.quotation?.totalAmount || '0'))}
                      </p>
                      <Badge
                        variant={
                          item.status === 'APPROVED'
                            ? 'approved'
                            : item.status === 'REJECTED'
                            ? 'rejected'
                            : 'negotiating'
                        }
                        size="sm"
                        className="mt-1"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Recent Invoices</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/finance/invoices')}
            >
              View All ({overview.pendingInvoicesCount + overview.paidInvoicesCount})
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {data?.recentInvoices?.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No invoices recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {data?.recentInvoices?.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => navigate(`/finance/invoices/${inv.id}`)}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-[#3568ed] hover:underline flex items-center gap-1">
                        <span>{inv.invoiceNumber}</span>
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        {inv.customer?.companyName || 'Customer Account'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#17213a]">
                        {formatINR(parseFloat(inv.totalAmount))}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-blue-100 text-blue-800'
                            : inv.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
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
  );
};
