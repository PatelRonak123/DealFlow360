import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuotation, useConfirmQuotation } from '../hooks';
import {
  StatusBadge,
  CustomerLoadingState,
  CustomerErrorState,
  ApprovalStatus,
  NegotiationTimeline,
  ConfirmQuotationModal,
} from '../components';
import {
  ArrowLeft,
  Tag,
  CheckCircle,
  Clock3,
  Boxes,
  GitBranch,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const QuotationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { data: quotation, isLoading, isError, refetch } = useQuotation(id || '');
  const confirmMutation = useConfirmQuotation(id || '');

  if (isLoading) {
    return <CustomerLoadingState message="Loading quotation details..." />;
  }

  if (isError || !quotation) {
    return (
      <CustomerErrorState
        title="Quotation Not Found"
        message="The requested quotation could not be retrieved. It may have expired or belongs to another account."
        onRetry={() => refetch()}
      />
    );
  }

  const isApproved = quotation.status === 'APPROVED';
  const isConfirmed = quotation.status === 'CONFIRMED';
  const isNegotiating = quotation.status === 'NEGOTIATION' || quotation.status === 'PENDING_APPROVAL';

  const handleConfirm = () => {
    confirmMutation.mutate(undefined, {
      onSuccess: (result) => {
        setIsConfirmModalOpen(false);
        // Automatically navigate to the newly created order
        navigate(`/customer/orders/${result.order.id}`);
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/customer/quotations"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#59657d] shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
                Quotation {quotation.quotationNumber}
              </h1>
              <StatusBadge status={quotation.status} size="lg" />
              {quotation.versionNumber && quotation.versionNumber > 1 && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                  <GitBranch className="h-3.5 w-3.5" /> V{quotation.versionNumber} Approved Revision
                </span>
              )}
            </div>
            <p className="text-xs text-[#8491aa] mt-0.5">
              Issued on {new Date(quotation.issueDate).toLocaleDateString()} • Valid until{' '}
              {new Date(quotation.expiryDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Can negotiate if not confirmed or expired */}
          {!isConfirmed && quotation.status !== 'EXPIRED' && (
            <Link
              to={`/customer/quotations/${quotation.id}/negotiate`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#3568ed] bg-white px-4 py-2.5 text-xs font-bold text-[#3568ed] shadow-sm transition hover:bg-[#edf4ff]"
            >
              <Tag className="h-4 w-4" />
              <span>Counter Discount / Change Request</span>
            </Link>
          )}

          {/* Confirm Button */}
          {isApproved && (
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Confirm Quotation</span>
            </button>
          )}

          {/* If already confirmed, button to view order */}
          {isConfirmed && quotation.orderId && (
            <Link
              to={`/customer/orders/${quotation.orderId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#3568ed]/20 hover:bg-[#274fc1] transition"
            >
              <Boxes className="h-4 w-4" />
              <span>View Order ({quotation.orderNumber})</span>
            </Link>
          )}
        </div>
      </div>

      {/* Revision State Notice */}
      {quotation.versionNumber && quotation.versionNumber > 1 && !isConfirmed && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-xs font-medium text-blue-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-sm block text-blue-950">
                Approved Revised Quotation (Version {quotation.versionNumber})
              </span>
              <span className="text-blue-800">
                Negotiated terms and updated discounts have been approved by sales management and applied to this proposal.
                {quotation.revisionReason && ` Rationale: "${quotation.revisionReason}"`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Negotiation State Notice: Under Review */}
      {quotation.activeNegotiation && (quotation.activeNegotiation.status === 'REQUESTED' || quotation.activeNegotiation.status === 'UNDER_REVIEW') && (
        <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 text-xs font-medium text-indigo-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-indigo-600 shrink-0 animate-spin-slow" />
            <div>
              <span className="font-bold text-sm block text-indigo-950">Negotiation Under Review</span>
              <span className="text-indigo-800">
                Your sales representative is reviewing your request for <strong>{quotation.activeNegotiation.requestedDiscountPercent}% discount</strong>.
                {quotation.activeNegotiation.customerMessage && ` Your note: "${quotation.activeNegotiation.customerMessage}".`}
                {' '}The existing proposal remains active and valid.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Negotiation State Notice: Declined */}
      {quotation.activeNegotiation && quotation.activeNegotiation.status === 'DECLINED' && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-medium text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-sm block text-amber-950">Negotiation Request Declined</span>
              <span className="text-amber-800">
                Your sales representative reviewed your request: &ldquo;{quotation.activeNegotiation.repResponse || 'Our current pricing represents the most competitive commercial rate available'}&rdquo;.
                The original proposal remains valid and ready for confirmation.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation State Notice */}
      {isConfirmed && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span>
              This quotation was <strong>confirmed</strong> and converted into Sales Order{' '}
              <strong>{quotation.orderNumber}</strong>.
            </span>
          </div>
          <Link
            to={`/customer/orders/${quotation.orderId}`}
            className="font-bold underline hover:text-emerald-950"
          >
            Track Order Details →
          </Link>
        </div>
      )}

      {/* Under Negotiation State Notice */}
      {isNegotiating && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-amber-600" />
            <span>
              A counteroffer of <strong>{quotation.discountPercent}% discount</strong> is currently under{' '}
              <strong>Governance Approval</strong>.
            </span>
          </div>
          <Link
            to={`/customer/quotations/${quotation.id}/negotiate`}
            className="font-bold underline hover:text-amber-950"
          >
            Update Counter Offer →
          </Link>
        </div>
      )}

      {/* Line Items Table */}
      <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#17213a]">Commercial Line Items</h2>
          <p className="text-xs text-[#8491aa]">Configured products, license packs, and item discounts</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e7ebf7] bg-[#f8faff] text-[#647592]">
              <tr>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Product / SKU</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">Qty</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Unit Price</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Discount</th>
                <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Net Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3fa]">
              {quotation.items.map((item) => (
                <tr key={item.id} className="transition hover:bg-[#fcfdff]">
                  <td className="py-4 px-4">
                    <p className="font-bold text-[#17213a]">{item.productName}</p>
                    <p className="mt-0.5 text-[11px] text-[#8491aa]">SKU: {item.sku}</p>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-[#17213a]">{item.quantity}</td>
                  <td className="py-4 px-4 text-right font-medium text-[#59657d]">
                    ₹ {parseFloat(item.unitPrice).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {parseFloat(item.discountPercent) > 0 ? (
                      <span className="font-bold text-emerald-600">
                        {item.discountPercent}% (₹{parseFloat(item.discountAmount).toLocaleString()})
                      </span>
                    ) : (
                      <span className="text-[#8491aa]">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-[#17213a]">
                    ₹ {parseFloat(item.netAmount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Breakdown Card */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-[#f8faff] p-5 space-y-2.5 text-xs">
            <div className="flex justify-between text-[#647592]">
              <span>Subtotal Gross</span>
              <span className="font-semibold text-[#17213a]">
                ₹ {parseFloat(quotation.subtotal).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Applied Commercial Discount ({quotation.discountPercent}%)</span>
              <span className="font-bold">
                - ₹ {parseFloat(quotation.discountAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[#647592]">
              <span>Tax (GST / Statutory)</span>
              <span className="font-semibold text-[#17213a]">
                ₹ {parseFloat(quotation.taxAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[#647592]">
              <span>Freight & Handling</span>
              <span className="font-semibold text-[#17213a]">
                {parseFloat(quotation.shippingAmount) > 0
                  ? `₹ ${parseFloat(quotation.shippingAmount).toLocaleString()}`
                  : 'Free / Included'}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-[#17213a]">Grand Total</span>
              <span className="text-xl font-extrabold text-[#3568ed]">
                ₹ {parseFloat(quotation.totalAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Negotiation Split Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Approval Governance */}
        <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17213a]">Approval Governance Status</h2>
              <p className="text-xs text-[#8491aa]">Sales Manager & Finance Operations escalation trail</p>
            </div>
          </div>
          <ApprovalStatus steps={quotation.approvalStatus?.steps || []} />
        </div>

        {/* Negotiation History */}
        <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17213a]">Negotiation History</h2>
              <p className="text-xs text-[#8491aa]">Discount counter offers and justification log</p>
            </div>
          </div>
          <NegotiationTimeline history={quotation.negotiationHistory || []} />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmQuotationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        quotation={quotation}
        isConfirming={confirmMutation.isPending}
      />
    </div>
  );
};
