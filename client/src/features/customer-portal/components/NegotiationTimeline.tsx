import React from 'react';
import { NegotiationHistoryEntry } from '../types';
import { Tag, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface NegotiationTimelineProps {
  history: NegotiationHistoryEntry[];
}

export const NegotiationTimeline: React.FC<NegotiationTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 text-center text-xs font-medium text-[#647592]">
        No previous discount counters or negotiation records for this quotation.
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-[#e7ebf7] ml-4 pl-6 space-y-6">
      {history.map((entry) => {
        const isApproved = entry.status === 'APPROVED';
        const isRejected = entry.status === 'REJECTED';

        return (
          <div key={entry.id} className="relative">
            {/* Timeline node */}
            <span
              className={`absolute -left-[35px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                isApproved
                  ? 'bg-emerald-500 text-white'
                  : isRejected
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isRejected ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </span>

            <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-[0_4px_16px_rgba(64,86,145,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f3fa] pb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#3568ed]/10 px-2.5 py-1 text-xs font-bold text-[#3568ed]">
                    <Tag className="h-3.5 w-3.5" />
                    Requested {entry.requestedDiscountPercent}% Discount
                  </span>
                  <span className="text-xs text-[#8491aa]">by {entry.requestedBy}</span>
                </div>
                <span className="text-xs text-[#8491aa]">
                  {new Date(entry.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {/* Justification & Reason */}
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8491aa]">
                  Customer Justification
                </p>
                <p className="mt-1 text-sm text-[#17213a] leading-relaxed font-medium">
                  {entry.reason}
                </p>
              </div>

              {/* Change Requests Tagged */}
              {entry.changeRequests && entry.changeRequests.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-[#8491aa]">Change Requests:</span>
                  {entry.changeRequests.map((req, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              )}

              {/* Approvals in this turn */}
              {entry.approvals && entry.approvals.length > 0 && (
                <div className="mt-4 border-t border-[#f0f3fa] pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8491aa] mb-2">
                    Governance Review
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {entry.approvals.map((appr, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#17213a]">
                            {appr.level === 'SALES_MANAGER' ? 'Sales Manager' : 'Finance Operations'}
                          </span>
                          <span
                            className={`font-semibold ${
                              appr.status === 'APPROVED'
                                ? 'text-emerald-600'
                                : appr.status === 'REJECTED'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {appr.status}
                          </span>
                        </div>
                        {appr.approverName && (
                          <p className="text-[11px] text-[#8491aa] mt-0.5">{appr.approverName}</p>
                        )}
                        {appr.comments && (
                          <p className="text-[11px] text-[#59657d] mt-1 italic">
                            &ldquo;{appr.comments}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
