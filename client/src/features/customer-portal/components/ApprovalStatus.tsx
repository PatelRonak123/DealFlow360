import React from 'react';
import { ApprovalStep } from '../types';
import { CheckCircle2, Clock, XCircle, ShieldCheck, UserCheck } from 'lucide-react';

interface ApprovalStatusProps {
  steps: ApprovalStep[];
  overallStatus?: string;
}

export const ApprovalStatus: React.FC<ApprovalStatusProps> = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-600">
        Standard quotation — No external managerial escalation required.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const isApproved = step.status === 'APPROVED';
        const isRejected = step.status === 'REJECTED';

        const roleLabel =
          step.level === 'SALES_MANAGER' ? 'Sales Manager Review' : 'Finance Operations Approval';

        return (
          <div
            key={idx}
            className={`flex items-start justify-between rounded-xl border p-4 transition ${
              isApproved
                ? 'border-emerald-200 bg-emerald-50/50'
                : isRejected
                ? 'border-rose-200 bg-rose-50/50'
                : 'border-amber-200 bg-amber-50/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-700'
                    : isRejected
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {step.level === 'SALES_MANAGER' ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-[#17213a]">{roleLabel}</p>
                {step.approverName && (
                  <p className="text-xs font-medium text-[#647592]">
                    Reviewer: <span className="text-[#17213a] font-semibold">{step.approverName}</span>
                  </p>
                )}
                {step.comments && (
                  <p className="mt-1.5 text-xs text-[#59657d] bg-white/70 rounded-lg p-2 border border-slate-200/60">
                    &ldquo;{step.comments}&rdquo;
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800'
                    : isRejected
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isApproved ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Approved
                  </>
                ) : isRejected ? (
                  <>
                    <XCircle className="h-3 w-3" /> Rejected
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" /> Pending Review
                  </>
                )}
              </span>
              {step.decidedAt && (
                <p className="mt-1 text-[11px] text-[#8491aa]">
                  {new Date(step.decidedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
