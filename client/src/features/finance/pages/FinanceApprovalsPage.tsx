import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Check,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  Clock,
  User,
  CheckCircle2,
  Percent,
  ExternalLink,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  useFinanceApprovals,
  useApproveFinanceDealMutation,
  useRejectFinanceDealMutation,
  useReturnFinanceDealMutation,
} from '../hooks/useFinance';
import { formatINR, formatDate } from '@/utils/formatters';

export const FinanceApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');

  // Modal states
  const [itemToApprove, setItemToApprove] = useState<any | null>(null);
  const [approveComments, setApproveComments] = useState('');
  const [itemToReject, setItemToReject] = useState<any | null>(null);
  const [rejectComments, setRejectComments] = useState('');
  const [itemToReturn, setItemToReturn] = useState<any | null>(null);
  const [returnComments, setReturnComments] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useFinanceApprovals({
    status: selectedStatus,
  });

  const approveMutation = useApproveFinanceDealMutation();
  const rejectMutation = useRejectFinanceDealMutation();
  const returnMutation = useReturnFinanceDealMutation();

  const allItems: any[] = data?.items || [];
  const filteredItems = allItems.filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const quoteNum = item.quotation?.quotationNumber?.toLowerCase() || '';
    const cust = item.quotation?.customer?.companyName?.toLowerCase() || '';
    const rep = item.quotation?.createdBy?.name?.toLowerCase() || '';
    return quoteNum.includes(q) || cust.includes(q) || rep.includes(q);
  });

  const totalValueUnderReview = allItems.reduce((sum: number, item: any) => {
    return sum + (parseFloat(String(item.quotation?.totalAmount)) || 0);
  }, 0);

  const highestDiscount = allItems.reduce((max: number, item: any) => {
    const subtotal = parseFloat(String(item.quotation?.subtotal)) || 0;
    const discount = parseFloat(String(item.quotation?.discountAmount)) || 0;
    const computedPct = subtotal > 0 ? (discount / subtotal) * 100 : 0;
    const d = parseFloat(String(item.requestedDiscountPercent)) || computedPct;
    return d > max ? d : max;
  }, 0);

  const handleOpenApproveModal = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToApprove(item);
    setApproveComments('');
    setActionError(null);
  };

  const handleOpenRejectModal = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToReject(item);
    setRejectComments('');
    setActionError(null);
  };

  const handleOpenReturnModal = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToReturn(item);
    setReturnComments('');
    setActionError(null);
  };

  const handleConfirmApprove = async () => {
    if (!itemToApprove) return;
    setActionError(null);
    try {
      await approveMutation.mutateAsync({
        id: itemToApprove.id,
        comments: approveComments.trim() || undefined,
      });
      const quoteNum = itemToApprove.quotation?.quotationNumber || 'Quotation';
      setItemToApprove(null);
      setSuccessBanner(`${quoteNum} approved by Commercial Finance.`);
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to approve quotation.');
    }
  };

  const handleConfirmReject = async () => {
    if (!itemToReject) return;
    if (!rejectComments.trim() || rejectComments.trim().length < 3) {
      setActionError('Rejection comments must be at least 3 characters explaining the reason.');
      return;
    }
    setActionError(null);
    try {
      await rejectMutation.mutateAsync({
        id: itemToReject.id,
        comments: rejectComments.trim(),
      });
      const quoteNum = itemToReject.quotation?.quotationNumber || 'Quotation';
      setItemToReject(null);
      setSuccessBanner(`${quoteNum} has been rejected with financial feedback sent to the sales rep.`);
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to reject quotation.');
    }
  };

  const handleConfirmReturn = async () => {
    if (!itemToReturn) return;
    if (!returnComments.trim() || returnComments.trim().length < 3) {
      setActionError('Revision instructions must be at least 3 characters.');
      return;
    }
    setActionError(null);
    try {
      await returnMutation.mutateAsync({
        id: itemToReturn.id,
        comments: returnComments.trim(),
      });
      const quoteNum = itemToReturn.quotation?.quotationNumber || 'Quotation';
      setItemToReturn(null);
      setSuccessBanner(`${quoteNum} returned for pricing revision.`);
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || 'Failed to return quotation.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Finance Tier-2 Governance
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17213a]">
            Commercial Finance Approvals
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Review high-risk deal exceptions, margin floor compliance, and executive signoffs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh Queue
        </Button>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Pending Reviews</p>
              <p className="text-xl font-bold text-[#17213a]">{allItems.length} Quotes</p>
              <p className="text-[11px] text-purple-600 font-medium">Awaiting Finance decision</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Percent className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Highest Requested Discount</p>
              <p className="text-xl font-bold text-amber-600">{highestDiscount > 0 ? `${highestDiscount.toFixed(1)}%` : '0%'}</p>
              <p className="text-[11px] text-gray-500 font-medium">Escalated past manager tier</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Pipeline Value at Risk</p>
              <p className="text-xl font-bold text-[#17213a]">{formatINR(totalValueUnderReview)}</p>
              <p className="text-[11px] text-blue-600 font-medium">Total deal volume in queue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        {/* Search Input */}
        <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search by quote number, customer, or rep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedStatus === st
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Approvals Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mb-3" />
              <p className="text-sm font-semibold text-[#17213a]">Loading Finance approvals queue...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-sm font-semibold text-red-700">Failed to load approvals queue</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <ShieldCheck className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-sm font-bold text-[#17213a]">No approvals found</h3>
              <p className="mt-1 text-xs text-gray-400 max-w-sm">
                {searchQuery
                  ? 'No approval requests match the search query.'
                  : 'The Commercial Finance approval queue is completely clear.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="py-3 px-6 font-semibold">Quotation</th>
                    <th className="py-3 font-semibold">Customer &amp; Rep</th>
                    <th className="py-3 font-semibold">Deal Net Value</th>
                    <th className="py-3 font-semibold">Discount Requested</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 font-semibold">Requested Date</th>
                    <th className="py-3 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {filteredItems.map((item) => {
                    const quote = item.quotation;
                    const totalNum = parseFloat(String(quote?.totalAmount)) || 0;
                    const subtotalNum = parseFloat(String(quote?.subtotal)) || 0;
                    const discountNum = parseFloat(String(quote?.discountAmount)) || 0;
                    const discountPct = subtotalNum > 0 ? (discountNum / subtotalNum) * 100 : 0;
                    const customerName = quote?.customer?.companyName || 'Unassigned Customer';
                    const repName = quote?.createdBy?.name || 'Sales Rep';

                    return (
                      <tr
                        key={item.id}
                        className="group hover:bg-[#f8faff] transition"
                      >
                        <td className="py-3.5 px-6 font-bold text-[#3568ed]">
                          <div
                            onClick={() => navigate(`/finance/approvals/${item.id}`)}
                            className="flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <span>{quote?.quotationNumber}</span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </td>

                        <td className="py-3.5">
                          <p className="font-semibold text-[#17213a]">{customerName}</p>
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                            <User className="h-3 w-3 text-gray-400" />
                            <span>{repName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 font-bold text-[#17213a]">
                          {formatINR(totalNum)}
                        </td>

                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-700">{discountPct.toFixed(1)}%</span>
                            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Tier 2
                            </span>
                          </div>
                          {discountNum > 0 && (
                            <p className="text-[11px] text-gray-500">{formatINR(discountNum)} off</p>
                          )}
                        </td>

                        <td className="py-3.5">
                          <Badge
                            variant={
                              item.status === 'APPROVED'
                                ? 'approved'
                                : item.status === 'REJECTED'
                                ? 'rejected'
                                : 'negotiating'
                            }
                            size="sm"
                          >
                            {item.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 text-gray-500">
                          {formatDate(item.requestedAt)}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] font-semibold text-purple-700 border-purple-200 hover:bg-purple-50"
                              onClick={() => navigate(`/finance/approvals/${item.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1 text-purple-600" />
                              Review
                            </Button>

                            {item.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                  onClick={(e) => handleOpenApproveModal(item, e)}
                                  title="Quick Approve"
                                >
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] font-semibold text-amber-700 border-amber-200 hover:bg-amber-50"
                                  onClick={(e) => handleOpenReturnModal(item, e)}
                                  title="Return for Revision"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                                  onClick={(e) => handleOpenRejectModal(item, e)}
                                  title="Reject Deal"
                                >
                                  <X className="h-3.5 w-3.5 text-rose-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Approve Modal */}
      <Modal
        isOpen={Boolean(itemToApprove)}
        onClose={() => setItemToApprove(null)}
        title="Authorize Tier-2 Commercial Deal"
        description="Grant financial signoff and move deal to final customer acceptance."
        maxWidth="md"
      >
        {itemToApprove && (
          <div className="space-y-4">
            {actionError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}
            <div className="rounded-xl border border-[#e2e8f5] bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Quotation ID:</span>
                <span className="font-bold text-[#17213a]">{itemToApprove.quotation?.quotationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-[#17213a]">{itemToApprove.quotation?.customer?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Net Deal Value:</span>
                <span className="font-bold text-emerald-700">
                  {formatINR(parseFloat(itemToApprove.quotation?.totalAmount || '0'))}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17213a] mb-1.5">
                Financial Signoff Comments (Optional)
              </label>
              <textarea
                value={approveComments}
                onChange={(e) => setApproveComments(e.target.value)}
                placeholder="E.g., Approved based on confirmed strategic customer revenue commitments..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setItemToApprove(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? 'Authorizing...' : 'Authorize Deal'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(itemToReject)}
        onClose={() => setItemToReject(null)}
        title="Reject High-Risk Deal"
        description="Deny discount exception and record reasons."
        maxWidth="md"
      >
        {itemToReject && (
          <div className="space-y-4">
            {actionError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[#17213a] mb-1.5">
                Rejection Reason (Required)
              </label>
              <textarea
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="State commercial reason, minimum margin shortfall, etc..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setItemToReject(null)}>
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
        )}
      </Modal>

      {/* Return for Revision Modal */}
      <Modal
        isOpen={Boolean(itemToReturn)}
        onClose={() => setItemToReturn(null)}
        title="Return Quotation for Pricing Revision"
        description="Instruct sales representative to adjust line items or pricing before resubmitting."
        maxWidth="md"
      >
        {itemToReturn && (
          <div className="space-y-4">
            {actionError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[#17213a] mb-1.5">
                Revision Feedback &amp; Target Margins (Required)
              </label>
              <textarea
                value={returnComments}
                onChange={(e) => setReturnComments(e.target.value)}
                placeholder="E.g., Reduce discount on enterprise software line to maximum 15% to maintain margin floor..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setItemToReturn(null)}>
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
        )}
      </Modal>
    </div>
  );
};
