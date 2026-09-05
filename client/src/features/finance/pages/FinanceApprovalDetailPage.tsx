import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  RotateCcw,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  useFinancialDealReview,
  useApproveFinanceDealMutation,
  useRejectFinanceDealMutation,
  useReturnFinanceDealMutation,
} from '../hooks/useFinance';
import { formatINR, formatDate } from '@/utils/formatters';

export const FinanceApprovalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveComments, setApproveComments] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectComments, setRejectComments] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnComments, setReturnComments] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useFinancialDealReview(id || '');

  const approveMutation = useApproveFinanceDealMutation();
  const rejectMutation = useRejectFinanceDealMutation();
  const returnMutation = useReturnFinanceDealMutation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mb-3" />
        <p className="text-sm font-semibold text-[#17213a]">Loading financial review dossier...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#17213a]">Failed to load deal review</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          {(error as Error)?.message || 'Quotation or approval record was not found.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/finance/approvals')}>
          Return to Queue
        </Button>
      </div>
    );
  }

  const { quotation, customer, createdBy, financialSummary, lineItems, approvalHistory } = data;
  const isPending = data.approvalStatus === 'PENDING';
  const approvalRecordId = data.approvalId || id || '';

  const handleConfirmApprove = async () => {
    setActionError(null);
    try {
      await approveMutation.mutateAsync({
        id: approvalRecordId,
        comments: approveComments.trim() || undefined,
      });
      setIsApproveModalOpen(false);
      setActionSuccess('Deal approved successfully by Commercial Finance.');
      refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to approve deal.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectComments.trim() || rejectComments.trim().length < 3) {
      setActionError('Rejection comments must be at least 3 characters.');
      return;
    }
    setActionError(null);
    try {
      await rejectMutation.mutateAsync({
        id: approvalRecordId,
        comments: rejectComments.trim(),
      });
      setIsRejectModalOpen(false);
      setActionSuccess('Deal rejected with financial feedback sent to sales rep.');
      refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to reject deal.');
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnComments.trim() || returnComments.trim().length < 3) {
      setActionError('Revision instructions must be at least 3 characters.');
      return;
    }
    setActionError(null);
    try {
      await returnMutation.mutateAsync({
        id: approvalRecordId,
        comments: returnComments.trim(),
      });
      setIsReturnModalOpen(false);
      setActionSuccess('Deal returned to sales representative for revision.');
      refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to return deal.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-6xl mx-auto">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/finance/approvals')}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#17213a] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Approvals Queue
        </button>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              data.approvalStatus === 'APPROVED'
                ? 'approved'
                : data.approvalStatus === 'REJECTED'
                ? 'rejected'
                : 'negotiating'
            }
          >
            Tier-2 {data.approvalStatus}
          </Badge>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#e2e8f5] bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Financial Deal Review Dossier
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17213a]">
            {quotation.quotationNumber}
          </h1>
          <p className="mt-1 text-xs text-[#59657d]">
            Issued on {formatDate(quotation.issueDate)} &bull; Valid until {formatDate(quotation.expiryDate)}
          </p>
        </div>

        {isPending && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="text-amber-700 border-amber-200 hover:bg-amber-50"
              leftIcon={<RotateCcw className="h-4 w-4 text-amber-600" />}
              onClick={() => {
                setIsReturnModalOpen(true);
                setActionError(null);
              }}
            >
              Return for Revision
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-rose-700 border-rose-200 hover:bg-rose-50"
              leftIcon={<X className="h-4 w-4 text-rose-600" />}
              onClick={() => {
                setIsRejectModalOpen(true);
                setActionError(null);
              }}
            >
              Reject Deal
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              leftIcon={<Check className="h-4 w-4" />}
              onClick={() => {
                setIsApproveModalOpen(true);
                setActionError(null);
              }}
            >
              Authorize &amp; Signoff
            </Button>
          </div>
        )}
      </div>

      {/* Commercial & Customer Metadata Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Account */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-gray-500 font-bold flex items-center gap-1.5">
              <Building className="h-4 w-4 text-purple-600" /> Customer Account
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p className="font-bold text-sm text-[#17213a]">{customer.companyName}</p>
            <div className="flex justify-between text-gray-500 pt-1">
              <span>Contact:</span>
              <span className="font-medium text-[#17213a]">{customer.contactName || 'Procurement Lead'}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Email:</span>
              <span className="font-medium text-[#17213a]">{customer.email}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Commercial Tier:</span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {customer.tierName}
              </span>
            </div>
            <div className="flex justify-between text-gray-500 pt-1">
              <span>Rep:</span>
              <span className="font-medium text-gray-700">{createdBy.name}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary & Margins */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-gray-500 font-bold flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" /> Commercial Margins
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex justify-between text-gray-500">
              <span>Gross Deal Value:</span>
              <span className="font-semibold text-gray-700">{formatINR(parseFloat(financialSummary.totalGrossRevenue))}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Total Discount:</span>
              <span className="font-bold text-amber-700">
                -{formatINR(parseFloat(financialSummary.totalDiscountGiven))} ({financialSummary.overallDiscountPercent}%)
              </span>
            </div>
            <div className="flex justify-between text-gray-500 border-t border-gray-100 pt-1">
              <span>Net Contract Value:</span>
              <span className="font-bold text-[#17213a] text-sm">{formatINR(parseFloat(financialSummary.totalNetRevenue))}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Estimated Cost Baseline:</span>
              <span className="font-medium text-gray-600">{formatINR(parseFloat(financialSummary.totalEstimatedCost))}</span>
            </div>
            <div className="flex justify-between text-gray-500 border-t border-gray-100 pt-1">
              <span>Projected Gross Margin:</span>
              <span className={`font-bold ${financialSummary.marginFloorCompliant ? 'text-emerald-700' : 'text-rose-700'}`}>
                {financialSummary.overallMarginPercent}% ({formatINR(parseFloat(financialSummary.totalGrossProfit))})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Risk Score & Governance Violations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-gray-500 font-bold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Risk Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Blended Risk Score:</span>
              <span className="text-base font-bold text-purple-700">{financialSummary.totalRiskScore}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Governance Rule Violations:</span>
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {financialSummary.violationCount} Violations
              </span>
            </div>
            <div className="pt-2">
              <span className="text-gray-500 block mb-1">Margin Floor Compliance:</span>
              {financialSummary.marginFloorCompliant ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Complies with &ge;20% Gross Margin Floor</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Violates 20% Gross Margin Floor</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rep Justification Note (if available) */}
      {quotation.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-gray-500 font-bold">
              Sales Representative Commercial Justification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-800 italic bg-slate-50 p-3 rounded-xl border border-gray-100">
              &ldquo;{quotation.notes}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Line Item Financial Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Line Item Financial Breakdown &amp; Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                  <th className="py-3 px-6 font-semibold">Product &amp; SKU</th>
                  <th className="py-3 font-semibold">Qty</th>
                  <th className="py-3 font-semibold">Unit Price</th>
                  <th className="py-3 font-semibold">Discount %</th>
                  <th className="py-3 font-semibold">Net Line</th>
                  <th className="py-3 font-semibold">Unit Cost</th>
                  <th className="py-3 font-semibold">Profit Margin</th>
                  <th className="py-3 px-6 font-semibold">Risk Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f5fb]">
                {lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8faff] transition">
                    <td className="py-3.5 px-6 font-semibold text-[#17213a]">
                      <p>{item.productName}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.sku}</p>
                    </td>

                    <td className="py-3.5 font-bold text-gray-700">
                      {item.quantity}
                    </td>

                    <td className="py-3.5 text-gray-600">
                      {formatINR(parseFloat(item.unitPrice))}
                    </td>

                    <td className="py-3.5">
                      <span className="font-bold text-amber-700">{item.discountPercent}%</span>
                      {item.evaluation?.isViolation && (
                        <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                          Limit: {item.evaluation.effectiveAllowedDiscount}%
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 font-bold text-[#17213a]">
                      {formatINR(parseFloat(item.netAmount))}
                    </td>

                    <td className="py-3.5 text-gray-500">
                      {formatINR(parseFloat(item.estimatedUnitCost))}
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`font-bold ${
                          parseFloat(item.marginPercent) >= 20 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {item.marginPercent}%
                      </span>
                      <p className="text-[10px] text-gray-400">{formatINR(parseFloat(item.grossProfit))}</p>
                    </td>

                    <td className="py-3.5 px-6">
                      {item.evaluation?.riskContribution ? (
                        <span className="font-semibold text-purple-700">
                          {item.evaluation.riskContribution}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Tier Approval Sequence History */}
      <Card>
        <CardHeader>
          <CardTitle>Governance Sequence &amp; Audit Trail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative border-l-2 border-purple-200 ml-4 pl-6 space-y-6">
            {approvalHistory.map((app, index) => (
              <div key={app.id} className="relative">
                <span
                  className={`absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${
                    app.status === 'APPROVED'
                      ? 'bg-emerald-500'
                      : app.status === 'REJECTED'
                      ? 'bg-rose-500'
                      : 'bg-purple-600'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#17213a]">
                      Stage {app.sequence}: {app.approvalLevel === 'MANAGER' ? 'Sales Manager Review' : 'Commercial Finance Signoff'}
                    </p>
                    <Badge
                      variant={
                        app.status === 'APPROVED'
                          ? 'approved'
                          : app.status === 'REJECTED'
                          ? 'rejected'
                          : 'negotiating'
                      }
                      size="sm"
                    >
                      {app.status}
                    </Badge>
                  </div>
                  {app.decidedBy && (
                    <p className="text-gray-600">
                      Decided by <span className="font-semibold">{app.decidedBy.name}</span> on {formatDate(app.decidedAt || '')}
                    </p>
                  )}
                  {app.comments && (
                    <p className="text-gray-700 italic pt-1 border-t border-gray-200/50">
                      &ldquo;{app.comments}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Authorize Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Authorize Commercial Deal Signoff"
        description="Confirm financial viability and authorize deal for customer contract generation."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {actionError}
            </div>
          )}
          <p className="text-gray-600">
            You are officially granting Finance signoff for quotation <strong>{quotation.quotationNumber}</strong> with a net value of <strong>{formatINR(parseFloat(quotation.totalAmount))}</strong>.
          </p>
          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Financial Signoff Notes (Optional)
            </label>
            <textarea
              value={approveComments}
              onChange={(e) => setApproveComments(e.target.value)}
              placeholder="E.g., Approved with 23% margin compliance..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 p-2.5 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Authorizing...' : 'Authorize Signoff'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject High-Risk Deal"
        description="Record commercial reasons for deal rejection."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {actionError}
            </div>
          )}
          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Rejection Reason (Required)
            </label>
            <textarea
              value={rejectComments}
              onChange={(e) => setRejectComments(e.target.value)}
              placeholder="State reason for denial..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 p-2.5 focus:border-rose-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending || rejectComments.trim().length < 3}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Deal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Return for Commercial Revision"
        description="Provide feedback to the representative to adjust pricing."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {actionError}
            </div>
          )}
          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Revision Feedback &amp; Target Margins (Required)
            </label>
            <textarea
              value={returnComments}
              onChange={(e) => setReturnComments(e.target.value)}
              placeholder="Specify pricing adjustments required before resubmission..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 p-2.5 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleConfirmReturn}
              disabled={returnMutation.isPending || returnComments.trim().length < 3}
            >
              {returnMutation.isPending ? 'Returning...' : 'Return for Revision'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
