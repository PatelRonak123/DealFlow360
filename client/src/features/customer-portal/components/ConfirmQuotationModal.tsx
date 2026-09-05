import React from 'react';
import { CustomerQuotationDetail } from '../types';
import { CheckCircle, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface ConfirmQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quotation: CustomerQuotationDetail;
  isConfirming: boolean;
}

export const ConfirmQuotationModal: React.FC<ConfirmQuotationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quotation,
  isConfirming,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isConfirming}
          className="absolute right-5 top-5 rounded-xl p-1 text-[#8491aa] hover:bg-slate-100 hover:text-[#17213a]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#17213a]">Confirm Quotation</h3>
            <p className="text-xs text-[#647592]">
              Convert quotation to active operational sales order
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-[#f8faff] p-4 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-[#647592]">Quotation Number</span>
            <span className="font-bold text-[#17213a]">{quotation.quotationNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#647592]">Applied Discount</span>
            <span className="font-bold text-emerald-600">
              {quotation.discountPercent}% (₹{parseFloat(quotation.discountAmount).toLocaleString()})
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#647592]">Line Items Total</span>
            <span className="font-bold text-[#17213a]">{quotation.items.length} items</span>
          </div>
          <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-[#17213a]">Final Total Amount</span>
            <span className="text-lg font-extrabold text-[#3568ed]">
              ₹ {parseFloat(quotation.totalAmount).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200/80">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p>
            By confirming, this commercial quotation will transition to <strong>CONFIRMED</strong> and
            trigger automatic <strong>Order & Warehouse Allocation</strong> workflows.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#59657d] hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isConfirming ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                <span>Confirming Order...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Confirm & Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
