import React from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { PendingApproval } from '../types';

interface ApprovalConfirmModalProps {
  approval: PendingApproval | null;
  comment: string;
  isProcessing: boolean;
  onCommentChange: (comment: string) => void;
  onClose: () => void;
  onConfirm: (id: string, comment?: string) => void;
}

export const ApprovalConfirmModal: React.FC<ApprovalConfirmModalProps> = ({
  approval,
  comment,
  isProcessing,
  onCommentChange,
  onClose,
  onConfirm,
}) => {
  if (!approval) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-[#e7ebf7] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle size={18} />
            </span>
            <h3 className="text-base font-bold text-[#17213a]">Approve Discount Request</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[#eef2f9] bg-[#f8faff] p-3.5 text-xs">
          <div className="flex justify-between py-1 border-b border-[#eef2f9]">
            <span className="text-[#8491aa]">Quotation:</span>
            <span className="font-bold text-[#3568ed]">{approval.quotationNumber}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#eef2f9]">
            <span className="text-[#8491aa]">Customer:</span>
            <span className="font-semibold text-[#17213a]">{approval.customerName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#eef2f9]">
            <span className="text-[#8491aa]">Total Value:</span>
            <span className="font-bold text-[#17213a]">{approval.amount}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#8491aa]">Requested Discount:</span>
            <span className="font-bold text-amber-600">{approval.requestedDiscount}% (Limit: {approval.maxRepLimit}%)</span>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="approval-notes" className="block text-xs font-semibold text-[#17213a]">
            Approval Notes / Justification (Optional)
          </label>
          <textarea
            id="approval-notes"
            rows={2}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            disabled={isProcessing}
            placeholder="E.g., Approved within quarterly margin budget for strategic account."
            className="mt-1.5 w-full rounded-xl border border-[#dce4f0] p-3 text-xs text-[#172033] outline-none transition focus:border-[#3568ed] focus:ring-2 focus:ring-[#3568ed]/15 disabled:bg-gray-50"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-[#dce4f0] px-4 py-2 text-xs font-semibold text-[#59657d] hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(approval.id, comment)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing Approval...
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                Confirm Approval
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalConfirmModal;
