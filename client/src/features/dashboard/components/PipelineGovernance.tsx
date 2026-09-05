import React from 'react';
import { AlertTriangle, FileText, Sparkles } from 'lucide-react';

export const PipelineGovernance: React.FC = () => {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_8px_24px_rgba(64,86,145,0.05)]">
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#17213a]">Pipeline Governance & Health</h2>
            <p className="text-xs text-[#59657d]">Automated risk alerts and threshold violations.</p>
          </div>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
            4 Action Items
          </span>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-3.5 transition hover:bg-red-50">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-red-100 p-2 text-red-600">
                <AlertTriangle size={16} />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-red-700">2 Excessive Discount Exceptions</p>
                  <span className="text-[10px] font-bold text-red-600">&gt;20% Discount</span>
                </div>
                <p className="mt-0.5 text-xs text-red-600/80">
                  Quotes for Tata Telematics and Apex Global exceed VP threshold limits.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 transition hover:bg-amber-50">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <FileText size={16} />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-800">3 Stalled High-Value Quotes</p>
                  <span className="text-[10px] font-bold text-amber-700">&gt;7 Days Inactive</span>
                </div>
                <p className="mt-0.5 text-xs text-amber-700/80">
                  Worth ₹ 18.4 L cumulative pipeline across Sarah Jenkins and Rahul Verma.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 transition hover:bg-blue-50">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-blue-100 p-2 text-blue-600">
                <Sparkles size={16} />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-700">Upsell Cross-Sell Identified</p>
                  <span className="text-[10px] font-bold text-blue-600">+₹ 4.2 L Potential</span>
                </div>
                <p className="mt-0.5 text-xs text-blue-600/80">
                  Recommendation rules flagged cloud backup add-ons for Acme Corp Global.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#e7ebf7] bg-[#f8fafe] p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#59657d]">Discount Rule Policy</span>
          <span className="font-bold text-[#3568ed]">Manager Rule Tier 2</span>
        </div>
        <p className="mt-1 text-[11px] text-[#8491aa]">
          Discounts 0-10%: Auto/Rep • 10.1-20%: Sales Manager • &gt;20%: VP & Finance approval required.
        </p>
      </div>
    </div>
  );
};

export default PipelineGovernance;
