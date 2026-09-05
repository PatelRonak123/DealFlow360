import React from 'react';
import {
  TrendingUp,
  Target,
  DollarSign,
  Percent,
  RefreshCw,
  ExternalLink,
  Award,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useRevenueAnalytics } from '../hooks/useRevenueAnalytics';
import { formatINR } from '@/utils/formatters';

interface RevenueAnalyticsSectionProps {
  isStandalone?: boolean;
}

export const RevenueAnalyticsSection: React.FC<RevenueAnalyticsSectionProps> = ({
  isStandalone = false,
}) => {
  const navigate = useNavigate();
  const { data, isFetching, refetch } = useRevenueAnalytics();

  const kpis = data?.kpis || {
    totalRevenueBooked: 0,
    projectedPipelineValue: 0,
    totalDealsWon: 0,
    openPipelineDeals: 0,
    averageDealSize: 0,
    quotaTarget: 8000000,
    quotaAttainmentPct: 0,
    avgDiscountPct: 0,
    totalDiscountGiven: 0,
    marginRetentionPct: 100,
  };

  const monthlyTrends = data?.monthlyTrends || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const tierBreakdown = data?.tierBreakdown || [];
  const repPerformance = data?.repPerformance || [];
  const stageFunnel = data?.stageFunnel || [];

  // Max value for bar scaling
  const maxTrendValue = Math.max(
    ...monthlyTrends.map((t) => Math.max(t.bookedRevenue, t.target, t.pipeline)),
    1000000
  );

  return (
    <div className="space-y-6">
      {/* Top Header Strip with Refresh & Full Page Nav */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#17213a]">Revenue Operations &amp; Quota Pacing</h2>
          <p className="text-xs text-[#71809f]">Live commercial performance metrics powered by PostgreSQL database.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-[#3568ed]' : ''}`} />
            <span>{isFetching ? 'Syncing...' : 'Refresh'}</span>
          </button>
          {!isStandalone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/reports')}
              leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Full Reports Suite
            </Button>
          )}
        </div>
      </div>

      {/* Top 4 Revenue Performance KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Booked Revenue
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{formatINR(kpis.totalRevenueBooked)}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>{kpis.quotaAttainmentPct}% Quota Paced</span>
              <span className="text-gray-400 font-normal">Target: {formatINR(kpis.quotaTarget)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#3568ed]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Pipeline Value
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-[#3568ed]">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">
              {formatINR(kpis.projectedPipelineValue)}
            </p>
            <p className="mt-1 text-xs text-[#3568ed] font-medium">
              {kpis.openPipelineDeals} active opportunities in motion
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Avg Deal Size
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{formatINR(kpis.averageDealSize)}</p>
            <p className="mt-1 text-xs text-purple-600 font-medium">
              {kpis.totalDealsWon} approved contracts closed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Discount Margin Erosion
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Percent className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{kpis.avgDiscountPct}%</p>
            <p className="mt-1 text-xs text-amber-600 font-medium">
              {formatINR(kpis.totalDiscountGiven)} total discount given
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: 6-Month Monthly Trend & Pipeline Funnel */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Monthly Revenue vs Target Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-[#17213a]">6-Month Revenue &amp; Target Pacing</h3>
                <p className="text-xs text-gray-400">Comparing realized revenue against benchmark pacing</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-[#3568ed]" />
                  <span className="text-gray-600">Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-emerald-400" />
                  <span className="text-gray-600">Target</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {monthlyTrends.map((trend) => {
                const bookedPct = Math.min(100, Math.round((trend.bookedRevenue / maxTrendValue) * 100));
                const targetPct = Math.min(100, Math.round((trend.target / maxTrendValue) * 100));

                return (
                  <div key={trend.month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                      <span>{trend.month}</span>
                      <span className="font-bold text-[#17213a]">{formatINR(trend.bookedRevenue)}</span>
                    </div>
                    <div className="relative h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      {/* Target marker line */}
                      <div
                        className="absolute top-0 bottom-0 z-10 w-1 bg-emerald-500"
                        style={{ left: `${targetPct}%` }}
                        title={`Target: ${formatINR(trend.target)}`}
                      />
                      {/* Booked bar */}
                      <div
                        className="h-full rounded-full bg-[#3568ed] transition-all duration-500"
                        style={{ width: `${bookedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stage Funnel Conversion */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#17213a]">Pipeline Conversion Velocity</h3>
                <p className="text-xs text-gray-400">Deal velocity across lifecycle stages</p>
              </div>
              <Layers className="h-4 w-4 text-gray-400" />
            </div>

            <div className="space-y-3">
              {stageFunnel.map((step) => (
                <div
                  key={step.stage}
                  className="rounded-xl border border-gray-100 bg-[#fbfcfe] p-3 transition hover:border-blue-200"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#17213a]">{step.label}</span>
                    <span className="font-bold text-[#3568ed]">{step.conversionPct}% conversion</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{step.count} Deals Logged</span>
                    <span className="font-semibold text-gray-800">{formatINR(step.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Category Breakdown & Customer Tier Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Category Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-[#17213a] mb-1">Revenue by Product Portfolio</h3>
            <p className="text-xs text-gray-400 mb-4">Distribution across SaaS subscriptions, hardware, and services</p>

            <div className="space-y-3">
              {categoryBreakdown.slice(0, 5).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#17213a] truncate max-w-[240px]">
                      {cat.category}
                    </span>
                    <span className="font-bold text-[#17213a]">{formatINR(cat.revenue)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Tier Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-[#17213a] mb-1">Revenue by Customer Tier</h3>
            <p className="text-xs text-gray-400 mb-4">Commercial contribution from enterprise relationship tiers</p>

            <div className="space-y-3">
              {tierBreakdown.slice(0, 5).map((tier) => (
                <div key={tier.tierName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#17213a] truncate max-w-[240px]">
                      {tier.tierName}
                    </span>
                    <span className="font-bold text-[#17213a]">{formatINR(tier.revenue)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                      style={{ width: `${tier.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rep Quota Attainment Table */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-[#eef2f9] px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#17213a]">Sales Representative Quota Pacing</h3>
                <p className="text-xs text-gray-400">Team individual performance, win-rate, and discount discipline</p>
              </div>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                  <th className="py-3 px-6 font-semibold">Representative</th>
                  <th className="py-3 font-semibold">Revenue Booked</th>
                  <th className="py-3 font-semibold">Quota Target</th>
                  <th className="py-3 font-semibold">Attainment %</th>
                  <th className="py-3 font-semibold">Avg Discount</th>
                  <th className="py-3 px-6 font-semibold text-right">Performance Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f5fb]">
                {repPerformance.map((rep) => {
                  const isTop = rep.attainmentPct >= 100;
                  const isGood = rep.attainmentPct >= 60;

                  return (
                    <tr key={rep.repId} className="hover:bg-[#f8faff] transition">
                      <td className="py-3.5 px-6">
                        <p className="font-bold text-[#17213a]">{rep.name}</p>
                        <span className="text-[10px] text-gray-400">{rep.email}</span>
                      </td>
                      <td className="py-3.5 font-bold text-[#17213a]">{formatINR(rep.bookedRevenue)}</td>
                      <td className="py-3.5 text-gray-500">{formatINR(rep.quotaTarget)}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#17213a]">{rep.attainmentPct}%</span>
                          <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full ${
                                isTop ? 'bg-emerald-500' : isGood ? 'bg-[#3568ed]' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, rep.attainmentPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`font-semibold ${
                            rep.avgDiscount > 15 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {rep.avgDiscount}%
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Badge
                          variant={isTop ? 'approved' : isGood ? 'pending' : 'default'}
                          size="sm"
                        >
                          {isTop ? 'Quota Club' : isGood ? 'On Track' : 'Needs Pipeline'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
