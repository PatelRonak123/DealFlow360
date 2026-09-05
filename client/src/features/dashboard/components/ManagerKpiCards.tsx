import React from 'react';
import { ArrowDown, Award, ClipboardCheck, IndianRupee, Percent } from 'lucide-react';

interface ManagerKpiCardsProps {
  pipelineValue: number;
  openDealsCount: number;
  pendingCount: number;
  quotaAchieved: number;
  quotaTarget: number;
  quotaPercent: number;
  avgDiscount: number;
  isLoading?: boolean;
}

function formatINRDisplay(val: number): string {
  if (isNaN(val) || val === 0) return '₹ 0';
  if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
  return `₹ ${val.toLocaleString('en-IN')}`;
}

export const ManagerKpiCards: React.FC<ManagerKpiCardsProps> = ({
  pipelineValue,
  openDealsCount,
  pendingCount,
  quotaAchieved,
  quotaTarget,
  quotaPercent,
  avgDiscount,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-[0_8px_24px_rgba(64,86,145,0.07)]"
          />
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* KPI 1: Team Pipeline Value */}
      <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-[0_8px_24px_rgba(64,86,145,0.07)] transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4ff] text-[#3568ed]">
            <IndianRupee size={20} />
          </span>
          <span className="text-2xl font-bold tracking-tight text-[#17213a]">
            {formatINRDisplay(pipelineValue)}
          </span>
        </div>
        <p className="mt-4 text-sm font-semibold text-[#59657d]">Team Pipeline Value</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#35ad79]">Active commercial pipeline</span>
          <span className="text-[11px] text-[#8491aa]">{openDealsCount} open deals</span>
        </div>
      </div>

      {/* KPI 2: Pending Manager Approvals */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/50 p-5 shadow-[0_8px_24px_rgba(245,158,11,0.1)] transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ClipboardCheck size={20} />
          </span>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              </span>
            )}
            <span className="text-2xl font-bold tracking-tight text-[#17213a]">{pendingCount}</span>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-[#17213a]">Pending Quote Approvals</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs font-bold text-amber-700">
            {pendingCount > 0 ? 'Manager override required' : 'All approvals cleared'}
          </p>
          {pendingCount > 0 && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              Priority
            </span>
          )}
        </div>
      </div>

      {/* KPI 3: Team Quota Attainment */}
      <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-[0_8px_24px_rgba(64,86,145,0.07)] transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf9f1] text-[#35ad79]">
            <Award size={20} />
          </span>
          <span className="text-2xl font-bold tracking-tight text-[#17213a]">{quotaPercent}%</span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#59657d]">Team Target Attainment</span>
            <span className="font-bold text-[#17213a]">
              {formatINRDisplay(quotaAchieved)} / {formatINRDisplay(quotaTarget)}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#35ad79] transition-all duration-500"
              style={{ width: `${Math.min(100, quotaPercent)}%` }}
            />
          </div>
        </div>
        <p className="mt-2 text-xs font-medium text-[#8491aa]">
          Based on officially approved deals
        </p>
      </div>

      {/* KPI 4: Avg Team Discount Rate */}
      <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-[0_8px_24px_rgba(64,86,145,0.07)] transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Percent size={20} />
          </span>
          <span className="text-2xl font-bold tracking-tight text-[#17213a]">{avgDiscount}%</span>
        </div>
        <p className="mt-4 text-sm font-semibold text-[#59657d]">Avg. Team Discount</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="flex items-center gap-1 text-xs font-bold text-[#35ad79]">
            <ArrowDown size={13} /> Disciplined Pricing
          </p>
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            Under 20% Cap
          </span>
        </div>
      </div>
    </section>
  );
};

export default ManagerKpiCards;
