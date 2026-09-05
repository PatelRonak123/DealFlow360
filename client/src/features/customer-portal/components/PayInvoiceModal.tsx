import React, { useState } from 'react';
import { CustomerInvoice } from '../types';
import { CreditCard, Landmark, QrCode, ShieldCheck, X } from 'lucide-react';

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: (paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI') => void;
  invoice: CustomerInvoice;
  isProcessing: boolean;
}

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({
  isOpen,
  onClose,
  onPay,
  invoice,
  isProcessing,
}) => {
  const [method, setMethod] = useState<'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI'>('NET_BANKING');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-5 top-5 rounded-xl p-1 text-[#8491aa] hover:bg-slate-100 hover:text-[#17213a]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3568ed] shadow-inner">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#17213a]">Pay Invoice {invoice.invoiceNumber}</h3>
            <p className="text-xs text-[#647592]">
              Order: <span className="font-semibold text-[#17213a]">{invoice.orderNumber}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#e7ebf7] bg-[#f8faff] p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#647592]">Balance Due</span>
            <span className="text-xl font-extrabold text-[#3568ed]">
              ₹ {parseFloat(invoice.balanceDue).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mt-5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#8491aa]">
            Select Payment Method
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {[
              { id: 'NET_BANKING', label: 'Corporate NetBanking', icon: Landmark },
              { id: 'CREDIT_CARD', label: 'Corporate Card', icon: CreditCard },
              { id: 'UPI', label: 'Instant UPI / QR', icon: QrCode },
              { id: 'BANK_TRANSFER', label: 'RTGS / NEFT Wire', icon: ShieldCheck },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = method === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMethod(opt.id as any)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-[#3568ed] bg-[#edf4ff] text-[#3568ed] ring-2 ring-[#3568ed]/20'
                      : 'border-slate-200 bg-white text-[#59657d] hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#59657d] hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onPay(method)}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#3568ed]/25 hover:bg-[#274fc1] transition disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                <span>Processing Settlement...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Pay ₹ {parseFloat(invoice.balanceDue).toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
