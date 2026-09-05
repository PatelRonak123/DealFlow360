import React from 'react';
import { Repeat } from 'lucide-react';
import { SubscriptionsSection } from '../components/SubscriptionsSection';

export const SubscriptionsManagementPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-700">
            <Repeat size={14} />
            Recurring SaaS &amp; Contracts
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17213a] sm:text-3xl">
            Subscription &amp; ARR Portfolio
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Track recurring contract commitments, annual run-rates (ARR), and upcoming renewal milestones.
          </p>
        </div>
      </div>

      <SubscriptionsSection isStandalone={true} />
    </div>
  );
};

export default SubscriptionsManagementPage;
