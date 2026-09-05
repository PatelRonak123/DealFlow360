import React from 'react';
import { TrendingUp } from 'lucide-react';
import { RevenueAnalyticsSection } from '../components/RevenueAnalyticsSection';

export const RevenueAnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <TrendingUp size={14} />
            Executive Financial Intelligence
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17213a] sm:text-3xl">
            Revenue &amp; Pipeline Analytics
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Monitor enterprise deal velocity, quota pacing, discount margin erosion, and revenue forecasting.
          </p>
        </div>
      </div>

      <RevenueAnalyticsSection isStandalone={true} />
    </div>
  );
};

export default RevenueAnalyticsPage;
