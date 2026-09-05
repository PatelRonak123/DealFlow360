import React from 'react';
import { X, XCircle } from 'lucide-react';
import { PendingApproval } from '../types';

interface ApprovalRejectModalProps {
  approval: PendingApproval | null;
  comment: string;
  isProcessing: boolean;
  onCommentChange: (comment: string) => void;
  onClose: () => void;
  onConfirm: (id: string, comment: string) => void;
}

export const ApprovalRejectModal: React.FC<ApprovalRejectModalProps> = ({
  approval,
  comment,
  isProcessing,
  onCommentChange,
  onClose,
  onConfirm,
}) => {
  if (!approval) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-[#e7ebf7] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#17213a]">Reject Discount Exception</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-2 text-xs text-[#59657d]">
          Please provide a business rationale for rejecting the requested discount of{' '}
          <span className="font-bold text-red-600">{approval.requestedDiscount}%</span> for{' '}
          <span className="font-semibold text-[#17213a]">{approval.customerName}</span> ({approval.quotationNumber}).
        </p>

        <div className="mt-4">
          <label htmlFor="rejection-reason" className="block text-xs font-semibold text-[#17213a]">
            Rejection Reason / Guidance for Rep
          </label>
          <textarea
            id="rejection-reason"
            rows={3}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="E.g., Discount is too high for current quarter margin guidelines. Counter-offer maximum 14% with annual upfront billing."
            className="mt-1.5 w-full rounded-xl border border-[#dce4f0] p-3 text-xs text-[#172033] outline-none transition focus:border-[#3568ed] focus:ring-2 focus:ring-[#3568ed]/15"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dce4f0] px-4 py-2 text-xs font-semibold text-[#59657d] hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(approval.id, comment)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle size={14} />
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalRejectModal;
