import React, { useState } from 'react';
import { Check, CheckCircle2, X, Clock, Loader2 } from 'lucide-react';
import { PendingApproval } from '../types';

interface ApprovalQueueTableProps {
  approvals: PendingApproval[];
  isLoading?: boolean;
  isProcessing: boolean;
  onApproveClick: (approval: PendingApproval) => void;
  onRejectClick: (approval: PendingApproval) => void;
}

export const ApprovalQueueTable: React.FC<ApprovalQueueTableProps> = ({
  approvals,
  isLoading = false,
  isProcessing,
  onApproveClick,
  onRejectClick,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'high_discount' | 'urgent'>('all');

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

  const filteredApprovals = pendingApprovals.filter((app) => {
    if (activeTab === 'high_discount') return app.requestedDiscount >= 20;
    if (activeTab === 'urgent') return app.amountRaw >= 500000;
    return true;
  });

  return (
    <section
      id="approvals-queue"
      className="rounded-3xl border border-[#e7ebf7] bg-white p-7 shadow-[0_8px_24px_rgba(64,86,145,0.06)]"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#17213a]">Quotation Approval Governance</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              {pendingApprovals.length} Pending Action
            </span>
          </div>
          <p className="mt-1 text-xs text-[#59657d]">
            Review quotations with discount exceptions exceeding standard sales rep thresholds (10%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[#e7ebf7] bg-[#f7f9fd] p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-[#3568ed] shadow-xs'
                  : 'text-[#59657d] hover:text-[#17213a]'
              }`}
            >
              All Pending ({pendingApprovals.length})
            </button>
            <button
              onClick={() => setActiveTab('high_discount')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                activeTab === 'high_discount'
                  ? 'bg-white text-[#3568ed] shadow-xs'
                  : 'text-[#59657d] hover:text-[#17213a]'
              }`}
            >
              High Discount (&ge;20%)
            </button>
            <button
              onClick={() => setActiveTab('urgent')}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                activeTab === 'urgent'
                  ? 'bg-white text-[#3568ed] shadow-xs'
                  : 'text-[#59657d] hover:text-[#17213a]'
              }`}
            >
              Major Deals (&ge;₹5L)
            </button>
          </div>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="mt-6 overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 size={32} className="animate-spin text-[#3568ed]" />
            <p className="mt-3 text-xs font-medium text-[#8491aa]">Loading pending approvals from database...</p>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <CheckCircle2 size={40} className="text-emerald-500" />
            <p className="mt-3 text-sm font-bold text-[#17213a]">Approval Queue Clear</p>
            <p className="text-xs text-[#8491aa]">All submitted quotations and discount overrides have been evaluated.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#eef1f8] text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                <th className="pb-3 pl-2">Quotation</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Sales Representative</th>
                <th className="pb-3">Deal Value</th>
                <th className="pb-3">Requested Discount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f4fa] text-xs">
              {filteredApprovals.map((app) => (
                <tr key={app.id} className="transition hover:bg-[#fbfcfe]">
                  <td className="py-4 pl-2 font-bold text-[#3568ed]">
                    {app.quotationNumber}
                    <span className="block text-[10px] font-normal text-[#8491aa]">{app.submittedAt}</span>
                  </td>
                  <td className="py-4">
                    <span className="font-semibold text-[#17213a]">{app.customerName}</span>
                  </td>
                  <td className="py-4">
                    <div className="font-medium text-[#17213a]">{app.repName}</div>
                    <div className="text-[10px] text-[#8491aa]">{app.repEmail}</div>
                  </td>
                  <td className="py-4 font-bold text-[#17213a]">{app.amount}</td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                      <span>{app.requestedDiscount}%</span>
                      <span className="text-[10px] font-normal text-amber-600">(Limit: {app.maxRepLimit}%)</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                      <Clock size={11} />
                      Pending Approval
                    </span>
                  </td>
                  <td className="py-4 pr-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onApproveClick(app)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                        title="Review and approve discount"
                      >
                        <Check size={13} />
                        Approve
                      </button>
                      <button
                        onClick={() => onRejectClick(app)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                        title="Reject discount request"
                      >
                        <X size={13} />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default ApprovalQueueTable;
