import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuotation, useCreateNegotiation } from '../hooks';
import { CustomerLoadingState, CustomerErrorState, StatusBadge } from '../components';
import {
  ArrowLeft,
  Send,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

const CHANGE_OPTIONS = [
  'Increasing overall order quantity / licenses',
  'Requesting 3-year multi-year commitment',
  'Consolidating regional enterprise sites',
  'Accelerated payment terms (Net 15)',
  'Bundle additional training / professional services',
];

export const QuotationNegotiatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quotation, isLoading, isError, refetch } = useQuotation(id || '');
  const negotiationMutation = useCreateNegotiation(id || '');

  const [requestedDiscount, setRequestedDiscount] = useState<number>(15);
  const [reason, setReason] = useState<string>('');
  const [selectedChanges, setSelectedChanges] = useState<string[]>([
    'Increasing overall order quantity / licenses',
  ]);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Initialize discount with quotation's current discount when loaded
  React.useEffect(() => {
    if (quotation && quotation.discountPercent > 0) {
      setRequestedDiscount(quotation.discountPercent);
    }
  }, [quotation]);

  if (isLoading) {
    return <CustomerLoadingState message="Loading quotation parameters for negotiation..." />;
  }

  if (isError || !quotation) {
    return (
      <CustomerErrorState
        title="Quotation Not Found"
        message="Cannot initiate negotiation because the quotation could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  const subtotalNum = parseFloat(quotation.subtotal) || 0;
  const proposedDiscountAmount = (subtotalNum * requestedDiscount) / 100;
  const proposedNewTotal = subtotalNum - proposedDiscountAmount;

  const toggleChangeOption = (opt: string) => {
    if (selectedChanges.includes(opt)) {
      setSelectedChanges(selectedChanges.filter((c) => c !== opt));
    } else {
      setSelectedChanges([...selectedChanges, opt]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    negotiationMutation.mutate(
      {
        requestedDiscountPercent: requestedDiscount,
        reason:
          reason ||
          `Requested ${requestedDiscount}% discount based on ${selectedChanges.join(', ')}`,
        changeRequests: selectedChanges,
        message: customMessage || undefined,
      },
      {
        onSuccess: () => {
          setSubmittedSuccess(true);
          setTimeout(() => {
            navigate(`/customer/quotations/${quotation.id}`);
          }, 1500);
        },
      }
    );
  };

  // Governance Tier Indicator
  const getGovernanceInfo = (discount: number) => {
    if (discount <= 10) {
      return {
        tier: 'Standard Tier (≤ 10%)',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Pre-approved under standard customer contract limits. Will process immediately.',
      };
    } else if (discount <= 20) {
      return {
        tier: 'Manager Review Tier (10% - 20%)',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'Requires fast-track approval from Sales Director before confirmation.',
      };
    } else {
      return {
        tier: 'Executive & Finance Tier (> 20%)',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        desc: 'High-discount threshold. Routes to Sales Director + Finance Ops Lead for deal margin sign-off.',
      };
    }
  };

  const govInfo = getGovernanceInfo(requestedDiscount);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/customer/quotations/${quotation.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#59657d] shadow-sm hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            Negotiate Quotation {quotation.quotationNumber}
          </h1>
          <p className="text-xs text-[#8491aa]">
            Submit discount counter-offer and commercial change requests for governance review
          </p>
        </div>
      </div>

      {submittedSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Counter offer submitted successfully! Routing to Quotation Details...</span>
        </div>
      )}

      {/* Comparison Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8491aa]">
            Current Terms
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-extrabold text-[#17213a]">
                ₹ {parseFloat(quotation.totalAmount).toLocaleString()}
              </p>
              <p className="text-xs text-[#647592] mt-0.5">
                Current Discount: {quotation.discountPercent}%
              </p>
            </div>
            <StatusBadge status={quotation.status} />
          </div>
        </div>

        <div className="rounded-3xl border border-[#3568ed]/30 bg-[#f4f7ff] p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#3568ed]">
            Proposed Counter Offer
          </span>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-extrabold text-[#3568ed]">
                ₹ {proposedNewTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-emerald-600 font-bold mt-0.5">
                Proposed Discount: {requestedDiscount}% (Save ₹{' '}
                {proposedDiscountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })})
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3568ed] text-white">
              <TrendingDown className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#e7ebf7] bg-white p-8 shadow-[0_4px_24px_rgba(64,86,145,0.06)] space-y-6"
      >
        {/* Discount Counter Slider & Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#17213a]">
              Requested Discount Percentage
            </label>
            <span className="rounded-xl bg-[#edf4ff] px-3 py-1 text-sm font-extrabold text-[#3568ed]">
              {requestedDiscount}%
            </span>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="35"
              step="1"
              value={requestedDiscount}
              onChange={(e) => setRequestedDiscount(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#3568ed]"
            />
            <div className="relative w-24 shrink-0">
              <input
                type="number"
                min="0"
                max="50"
                value={requestedDiscount}
                onChange={(e) => setRequestedDiscount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2 pr-6 text-center text-xs font-bold text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              />
              <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          {/* Governance Guidance Badge */}
          <div className={`mt-3 rounded-2xl border p-3 text-xs ${govInfo.badge}`}>
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{govInfo.tier}</span>
            </div>
            <p className="mt-1 text-[11px] opacity-90">{govInfo.desc}</p>
          </div>
        </div>

        {/* Change Request Checkboxes */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-3">
            Commercial Justification / Change Drivers
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {CHANGE_OPTIONS.map((opt) => {
              const isChecked = selectedChanges.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs transition ${
                    isChecked
                      ? 'border-[#3568ed] bg-[#edf4ff] text-[#17213a] font-semibold'
                      : 'border-slate-200 bg-white text-[#59657d] hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleChangeOption(opt)}
                    className="h-4 w-4 rounded text-[#3568ed] focus:ring-[#3568ed]"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Detailed Reason */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
            Detailed Reason for Counter-Offer
          </label>
          <input
            type="text"
            required
            placeholder="e.g. We are expanding from 2 regional sites to 4 data centers..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs text-[#17213a] placeholder-[#8491aa] focus:border-[#3568ed] focus:outline-none focus:ring-1 focus:ring-[#3568ed]"
          />
        </div>

        {/* Message to Sales Executive */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#17213a] block mb-2">
            Additional Notes for Account Executive (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Add any specific delivery requirements, budget timelines, or scope changes..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs text-[#17213a] placeholder-[#8491aa] focus:border-[#3568ed] focus:outline-none focus:ring-1 focus:ring-[#3568ed]"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Link
            to={`/customer/quotations/${quotation.id}`}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-[#59657d] hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={negotiationMutation.isPending || submittedSuccess}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#3568ed]/25 hover:bg-[#274fc1] transition disabled:opacity-50"
          >
            {negotiationMutation.isPending ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                <span>Submitting to Governance...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Counter Offer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
