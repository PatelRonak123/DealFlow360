import React from 'react';
import { Truck } from 'lucide-react';
import { FulfillmentLogisticsSection } from '../components/FulfillmentLogisticsSection';

export const FulfillmentLogisticsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#3568ed]">
            <Truck size={14} />
            Supply Chain &amp; Operations
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17213a] sm:text-3xl">
            Fulfillment &amp; Logistics Hub
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Manage multi-warehouse stock allocations, shipment manifests, and carrier courier dispatch.
          </p>
        </div>
      </div>

      <FulfillmentLogisticsSection isStandalone={true} />
    </div>
  );
};

export default FulfillmentLogisticsPage;
