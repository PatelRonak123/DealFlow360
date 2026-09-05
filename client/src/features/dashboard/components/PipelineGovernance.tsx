import React, { useState } from 'react';
import { AlertTriangle, FileText, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface PipelineGovernanceProps {
  excessiveDiscountQuotes: {
    quotationNumber: string;
    customerName: string;
    discountPercent: number;
    amount: string;
  }[];
  stalledQuotes: {
    quotationNumber: string;
    customerName: string;
    daysInactive: number;
    amount: string;
  }[];
  highValueQuotesCount: number;
  isLoading?: boolean;
}

export const PipelineGovernance: React.FC<PipelineGovernanceProps> = ({
  excessiveDiscountQuotes,
  stalledQuotes,
  highValueQuotesCount,
  isLoading = false,
}) => {
  const [isExcessiveExpanded, setIsExcessiveExpanded] = useState(false);
  const [isStalledExpanded, setIsStalledExpanded] = useState(false);
  const totalActionItems = excessiveDiscountQuotes.length + stalledQuotes.length;

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_8px_24px_rgba(64,86,145,0.05)]">
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#17213a]">Pipeline Governance & Health</h2>
            <p className="text-xs text-[#59657d]">Automated risk alerts and commercial threshold monitors.</p>
          </div>
          {totalActionItems > 0 ? (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 border border-red-100">
              {totalActionItems} Action {totalActionItems === 1 ? 'Item' : 'Items'}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
              0 Alerts • Compliant
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-gray-400 animate-pulse">
            Analyzing commercial deal health from database...
          </div>
        ) : totalActionItems === 0 && highValueQuotesCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-4">
            <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
            <p className="text-xs font-bold text-emerald-900">All Deals Within Governance Thresholds</p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              No quotations breach the 20% VP discount ceiling or exceed aging limits.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Excessive Discount Exceptions */}
            {excessiveDiscountQuotes.length > 0 ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-3.5 transition hover:bg-red-50">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-red-100 p-2 text-red-600">
                    <AlertTriangle size={16} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-red-700">
                        {excessiveDiscountQuotes.length} Excessive Discount {excessiveDiscountQuotes.length === 1 ? 'Exception' : 'Exceptions'}
                      </p>
                      <span className="text-[10px] font-bold text-red-600">&gt;20% Discount</span>
                    </div>

                    {!isExcessiveExpanded ? (
                      <p className="mt-0.5 text-xs text-red-600/80">
                        {excessiveDiscountQuotes
                          .slice(0, 2)
                          .map((q) => `${q.quotationNumber} (${q.customerName} - ${q.discountPercent}%)`)
                          .join(', ')}
                        {excessiveDiscountQuotes.length > 2 && ` and ${excessiveDiscountQuotes.length - 2} more`}
                      </p>
                    ) : (
                      <div className="mt-2 space-y-1.5 border-t border-red-200/50 pt-2">
                        {excessiveDiscountQuotes.map((q) => (
                          <div key={q.quotationNumber} className="flex items-center justify-between text-xs text-red-700">
                            <span className="font-semibold">{q.quotationNumber} - {q.customerName}</span>
                            <span className="font-bold bg-red-100/80 px-1.5 py-0.5 rounded text-[10px] text-red-800">
                              {q.discountPercent}% off • {q.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {excessiveDiscountQuotes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setIsExcessiveExpanded(!isExcessiveExpanded)}
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-900 transition cursor-pointer"
                      >
                        <span>{isExcessiveExpanded ? 'Show fewer' : `Show all ${excessiveDiscountQuotes.length} exceptions`}</span>
                        {isExcessiveExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Stalled Quotes */}
            {stalledQuotes.length > 0 ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 transition hover:bg-amber-50">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
                    <FileText size={16} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-amber-800">
                        {stalledQuotes.length} Stalled High-Value {stalledQuotes.length === 1 ? 'Quote' : 'Quotes'}
                      </p>
                      <span className="text-[10px] font-bold text-amber-700">&gt;7 Days Inactive</span>
                    </div>

                    {!isStalledExpanded ? (
                      <p className="mt-0.5 text-xs text-amber-700/80">
                        {stalledQuotes
                          .slice(0, 2)
                          .map((q) => `${q.quotationNumber} (${q.customerName} - ${q.amount})`)
                          .join(', ')}
                        {stalledQuotes.length > 2 && ` and ${stalledQuotes.length - 2} more`}
                      </p>
                    ) : (
                      <div className="mt-2 space-y-1.5 border-t border-amber-200/50 pt-2">
                        {stalledQuotes.map((q) => (
                          <div key={q.quotationNumber} className="flex items-center justify-between text-xs text-amber-800">
                            <span className="font-semibold">{q.quotationNumber} - {q.customerName}</span>
                            <span className="font-bold bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px] text-amber-900">
                              {q.daysInactive} days inactive • {q.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {stalledQuotes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setIsStalledExpanded(!isStalledExpanded)}
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 transition cursor-pointer"
                      >
                        <span>{isStalledExpanded ? 'Show fewer' : `Show all ${stalledQuotes.length} quotes`}</span>
                        {isStalledExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Compliant status when no alerts but deals exist */}
            {totalActionItems === 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-800">
                    Healthy Governance: All quotations comply with regional sales manager discount rules.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[#e7ebf7] bg-[#f8fafe] p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#59657d]">Discount Governance Policy</span>
          <span className="font-bold text-[#3568ed]">Manager Rule Tier 2</span>
        </div>
        <p className="mt-1 text-[11px] text-[#8491aa]">
          Discounts &le;10%: Rep Auto-Approve • 11%–20%: Sales Manager • &gt;20%: VP &amp; Finance approval required.
        </p>
      </div>
    </div>
  );
};

export default PipelineGovernance;
