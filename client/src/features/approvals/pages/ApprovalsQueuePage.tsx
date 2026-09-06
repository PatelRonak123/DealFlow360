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
  GitCompare,
  Tag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  usePendingApprovals,
  useApproveApprovalMutation,
  useRejectApprovalMutation,
} from '../hooks/useApprovals';
import {
  PendingApprovalItem,
  ApprovalLevel,
} from '../types/approval.types';
import { formatINR, formatDate } from '@/utils/formatters';

export const ApprovalsQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  // Modal states
  const [itemToApprove, setItemToApprove] = useState<PendingApprovalItem | null>(null);
  const [approveComments, setApproveComments] = useState('');
  const [itemToReject, setItemToReject] = useState<PendingApprovalItem | null>(null);
  const [itemToCompare, setItemToCompare] = useState<PendingApprovalItem | null>(null);
  const [rejectComments, setRejectComments] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const queryParams = {
    approvalLevel: selectedLevel !== 'all' ? (selectedLevel as ApprovalLevel) : undefined,
  };

  const { data, isLoading, isError, error, refetch } = usePendingApprovals(queryParams);
  const approveMutation = useApproveApprovalMutation();
  const rejectMutation = useRejectApprovalMutation();

  const allItems = data?.items || [];
  const filteredItems = allItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const quoteNum = item.quotation?.quotationNumber?.toLowerCase() || '';
    const cust = item.quotation?.customer?.companyName?.toLowerCase() || '';
    const rep = item.quotation?.createdBy?.name?.toLowerCase() || '';
    return quoteNum.includes(q) || cust.includes(q) || rep.includes(q);
  });

  // KPI calculations
  const totalValueUnderReview = allItems.reduce((sum, item) => {
    return sum + (parseFloat(String(item.quotation?.totalAmount)) || 0);
  }, 0);

  const highestDiscount = allItems.reduce((max, item) => {
    const subtotal = parseFloat(String(item.quotation?.subtotal)) || 0;
    const discount = parseFloat(String(item.quotation?.discountAmount)) || 0;
    const computedPct = subtotal > 0 ? (discount / subtotal) * 100 : 0;
    const d = parseFloat(String(item.requestedDiscountPercent)) || computedPct;
    return d > max ? d : max;
  }, 0);

  const handleOpenApproveModal = (item: PendingApprovalItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToApprove(item);
    setApproveComments('');
    setActionError(null);
  };

  const handleOpenRejectModal = (item: PendingApprovalItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToReject(item);
    setRejectComments('');
    setActionError(null);
  };

  const handleConfirmApprove = async () => {
    if (!itemToApprove) return;
    setActionError(null);

    try {
      await approveMutation.mutateAsync({
        id: itemToApprove.id,
        payload: {
          comments: approveComments.trim() || undefined,
        },
      });

      const quoteNum = itemToApprove.quotation?.quotationNumber || 'Quotation';
      setItemToApprove(null);
      setSuccessBanner(`${quoteNum} has been officially approved.`);
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to approve quotation. Please verify your permissions.'
      );
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
        payload: {
          comments: rejectComments.trim(),
        },
      });

      const quoteNum = itemToReject.quotation?.quotationNumber || 'Quotation';
      setItemToReject(null);
      setSuccessBanner(`${quoteNum} has been rejected with feedback sent to the sales representative.`);
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to reject quotation. Please verify your permissions.'
      );
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
              Governance &amp; Controls
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17213a]">
            Executive Approvals Queue
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Review discount exceptions, verify commercial profitability, and authorize deals.
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
              <p className="text-xs text-gray-500 font-semibold uppercase">Pending Requests</p>
              <p className="text-xl font-bold text-[#17213a]">{allItems.length} Quotes</p>
              <p className="text-[11px] text-purple-600 font-medium">Awaiting executive decision</p>
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
              <p className="text-[11px] text-gray-500 font-medium">Ceiling threshold exceeded</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Value Under Review</p>
              <p className="text-xl font-bold text-[#17213a]">{formatINR(totalValueUnderReview)}</p>
              <p className="text-[11px] text-blue-600 font-medium">Total pipeline pending approval</p>
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
            placeholder="Search by quote, customer, or rep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* Approval Level Filter */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Levels' },
            { id: 'MANAGER', label: 'Manager Review' },
            { id: 'FINANCE', label: 'Finance Review' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedLevel(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedLevel === tab.id
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
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
              <p className="text-sm font-semibold text-[#17213a]">Loading approvals queue...</p>
              <p className="text-xs text-[#71809f]">Fetching pending approvals from governance engine.</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-sm font-semibold text-red-700">Failed to load approvals</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                {(error as Error)?.message || 'An unexpected error occurred while fetching the approvals queue.'}
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <ShieldCheck className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-sm font-bold text-[#17213a]">No pending approvals</h3>
              <p className="mt-1 text-xs text-gray-400 max-w-sm">
                {searchQuery || selectedLevel !== 'all'
                  ? 'No pending approvals match the selected filters.'
                  : 'Great job! Your approvals queue is completely up to date.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="py-3 px-6 font-semibold">Quotation</th>
                    <th className="py-3 font-semibold">Customer &amp; Rep</th>
                    <th className="py-3 font-semibold">Total Net</th>
                    <th className="py-3 font-semibold">Requested Discount</th>
                    <th className="py-3 font-semibold">Level</th>
                    <th className="py-3 font-semibold">Requested At</th>
                    <th className="py-3 font-semibold">Rep Notes</th>
                    <th className="py-3 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {filteredItems.map((item) => {
                    const quote = item.quotation;
                    const totalNum = parseFloat(String(quote?.totalAmount)) || 0;
                    const subtotalNum = parseFloat(String(quote?.subtotal)) || 0;
                    const discountNum = parseFloat(String(quote?.discountAmount)) || 0;
                    const computedDiscountPct = subtotalNum > 0 ? (discountNum / subtotalNum) * 100 : 0;
                    const discountPct = parseFloat(String(item.requestedDiscountPercent)) || computedDiscountPct;
                    const maxAllowed = parseFloat(String(item.maxDiscountAllowed)) || (item.approvalLevel === 'MANAGER' ? 10 : 20);
                    const customerName = quote?.customer?.companyName || 'Unassigned Customer';
                    const repName = quote?.createdBy?.name || 'Sales Rep';
                    const repNotes = item.notes || quote?.notes || '—';

                    return (
                      <tr
                        key={item.id}
                        className="group hover:bg-[#f8faff] transition"
                      >
                        <td className="py-3.5 px-6 font-bold text-[#3568ed]">
                          <div
                            onClick={() => navigate(`/quotations/${quote?.id}`)}
                            className="flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <span>{quote?.quotationNumber}</span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                          {(quote?.isRevision || ((quote?.versionNumber || 1) > 1)) && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                V{quote.versionNumber || 2} Revision
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToCompare(item);
                                }}
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#3568ed] hover:underline cursor-pointer"
                              >
                                <GitCompare className="h-3 w-3" />
                                Diff
                              </button>
                            </div>
                          )}
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
                            <span className="text-[10px] text-gray-400 font-medium">
                              (limit: {maxAllowed.toFixed(0)}%)
                            </span>
                          </div>
                          {discountNum > 0 && (
                            <p className="text-[11px] text-gray-500">{formatINR(discountNum)} off</p>
                          )}
                        </td>

                        <td className="py-3.5">
                          <Badge
                            variant={item.approvalLevel === 'MANAGER' ? 'warning' : 'negotiating'}
                            size="sm"
                          >
                            {item.approvalLevel}
                          </Badge>
                        </td>

                        <td className="py-3.5 text-gray-500">
                          {formatDate(item.requestedAt)}
                        </td>

                        <td className="py-3.5 max-w-xs truncate text-gray-600 text-xs">
                          {repNotes}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                              onClick={(e) => handleOpenApproveModal(item, e)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              Approve
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                              onClick={(e) => handleOpenRejectModal(item, e)}
                            >
                              <X className="h-3.5 w-3.5 mr-1 text-rose-600" />
                              Reject
                            </Button>
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

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToApprove)}
        onClose={() => {
          if (!approveMutation.isPending) {
            setItemToApprove(null);
          }
        }}
        title="Authorize Quotation Discount"
        description="Verify commercial feasibility before granting approval."
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

            {(() => {
              const quote = itemToApprove.quotation;
              const subtotalNum = parseFloat(String(quote?.subtotal)) || 0;
              const discountNum = parseFloat(String(quote?.discountAmount)) || 0;
              const computedDiscountPct = subtotalNum > 0 ? (discountNum / subtotalNum) * 100 : 0;
              const discountPct = parseFloat(String(itemToApprove.requestedDiscountPercent)) || computedDiscountPct;
              const maxAllowed = parseFloat(String(itemToApprove.maxDiscountAllowed)) || (itemToApprove.approvalLevel === 'MANAGER' ? 10 : 20);
              const repNotes = itemToApprove.notes || quote?.notes;

              return (
                <div className="rounded-xl border border-[#e2e8f5] bg-slate-50/70 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quotation ID:</span>
                    <span className="font-bold text-[#17213a]">{quote?.quotationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-semibold text-[#17213a]">
                      {quote?.customer?.companyName || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Representative:</span>
                    <span className="font-medium text-gray-700">
                      {quote?.createdBy?.name || 'Sales Rep'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requested Discount:</span>
                    <span className="font-bold text-amber-700">
                      {discountPct.toFixed(1)}% (Allowed: {maxAllowed.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Net Value:</span>
                    <span className="font-bold text-[#17213a]">
                      {formatINR(parseFloat(String(quote?.totalAmount)) || 0)}
                    </span>
                  </div>
                  {repNotes && (
                    <div className="pt-2 border-t border-gray-200/60">
                      <span className="text-gray-500 block mb-0.5">Rep Justification:</span>
                      <p className="text-gray-700 italic bg-white p-2 rounded-lg border border-gray-100">
                        &ldquo;{repNotes}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-semibold text-[#17213a] mb-1.5">
                Executive Comments / Conditions (Optional)
              </label>
              <textarea
                value={approveComments}
                onChange={(e) => setApproveComments(e.target.value)}
                placeholder="E.g., Approved based on quarterly strategic customer commitment..."
                rows={3}
                disabled={approveMutation.isPending}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-[#17213a] placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition resize-none disabled:bg-gray-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToApprove(null)}
                disabled={approveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmApprove}
                disabled={approveMutation.isPending}
                leftIcon={
                  approveMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )
                }
              >
                {approveMutation.isPending ? 'Authorizing...' : 'Authorize & Approve'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(itemToReject)}
        onClose={() => {
          if (!rejectMutation.isPending) {
            setItemToReject(null);
          }
        }}
        title="Reject Quotation Discount"
        description="Explain commercial concerns to the sales representative."
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

            {(() => {
              const quote = itemToReject.quotation;
              const subtotalNum = parseFloat(String(quote?.subtotal)) || 0;
              const discountNum = parseFloat(String(quote?.discountAmount)) || 0;
              const computedDiscountPct = subtotalNum > 0 ? (discountNum / subtotalNum) * 100 : 0;
              const discountPct = parseFloat(String(itemToReject.requestedDiscountPercent)) || computedDiscountPct;
              const maxAllowed = parseFloat(String(itemToReject.maxDiscountAllowed)) || (itemToReject.approvalLevel === 'MANAGER' ? 10 : 20);

              return (
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quotation ID:</span>
                    <span className="font-bold text-[#17213a]">{quote?.quotationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-semibold text-[#17213a]">
                      {quote?.customer?.companyName || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requested Discount:</span>
                    <span className="font-bold text-rose-700">
                      {discountPct.toFixed(1)}% (Allowed: {maxAllowed.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-semibold text-[#17213a] mb-1.5">
                Rejection Reason (Required, min 3 characters)
              </label>
              <textarea
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="Specify reason for denial, required margin adjustments, or maximum acceptable discount..."
                rows={3}
                disabled={rejectMutation.isPending}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-[#17213a] placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/15 transition resize-none disabled:bg-gray-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToReject(null)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || rejectComments.trim().length < 3}
                leftIcon={
                  rejectMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )
                }
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revision Comparison (Diff) Modal */}
      <Modal
        isOpen={Boolean(itemToCompare)}
        onClose={() => setItemToCompare(null)}
        title="Quotation Revision Comparison (V1 vs V2)"
        description="Side-by-side analysis of commercial terms between the customer-visible quote and proposed revision."
        maxWidth="lg"
      >
        {itemToCompare && (
          <div className="space-y-5 text-xs">
            {/* Customer Negotiation Demand Context */}
            {itemToCompare.quotation?.negotiation && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-blue-600" />
                    Customer Negotiation Demand
                  </span>
                  <span className="rounded-md bg-blue-200/80 px-2 py-0.5 text-xs font-bold text-blue-900">
                    {itemToCompare.quotation.negotiation.requestedDiscountPercent}% Discount Requested
                  </span>
                </div>
                {itemToCompare.quotation.negotiation.customerMessage && (
                  <p className="text-blue-900 italic font-medium">
                    "{itemToCompare.quotation.negotiation.customerMessage}"
                  </p>
                )}
                {itemToCompare.quotation.negotiation.requestedChanges && itemToCompare.quotation.negotiation.requestedChanges.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {itemToCompare.quotation.negotiation.requestedChanges.map((req, idx) => (
                      <span key={idx} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-blue-800 border border-blue-200">
                        {req}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Side-by-Side Comparison Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-[#647592]">
                  <tr>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Commercial Metric</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-slate-700">
                      Original Quote (V1)
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[#3568ed]">
                      Revised Quote ({itemToCompare.quotation.quotationNumber})
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Variance / Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const origSubtotal = parseFloat(itemToCompare.quotation.parentQuotation?.subtotal || itemToCompare.quotation.subtotal);
                    const revSubtotal = parseFloat(itemToCompare.quotation.subtotal);

                    const origDiscount = parseFloat(itemToCompare.quotation.parentQuotation?.discountAmount || '0');
                    const revDiscount = parseFloat(itemToCompare.quotation.discountAmount);

                    const origTotal = parseFloat(itemToCompare.quotation.parentQuotation?.totalAmount || itemToCompare.quotation.totalAmount);
                    const revTotal = parseFloat(itemToCompare.quotation.totalAmount);

                    const origPct = origSubtotal > 0 ? (origDiscount / origSubtotal) * 100 : 0;
                    const revPct = revSubtotal > 0 ? (revDiscount / revSubtotal) * 100 : 0;

                    const totalDiff = revTotal - origTotal;

                    return (
                      <>
                        <tr>
                          <td className="py-3 px-4 font-medium text-slate-600">Subtotal</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{formatINR(origSubtotal)}</td>
                          <td className="py-3 px-4 font-bold text-[#3568ed]">{formatINR(revSubtotal)}</td>
                          <td className="py-3 px-4 text-right text-slate-500">
                            {formatINR(revSubtotal - origSubtotal)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium text-slate-600">Discount Rate</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{origPct.toFixed(1)}%</td>
                          <td className="py-3 px-4 font-bold text-amber-700">{revPct.toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-700">
                            +{(revPct - origPct).toFixed(1)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium text-slate-600">Discount Amount</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{formatINR(origDiscount)}</td>
                          <td className="py-3 px-4 font-bold text-amber-700">{formatINR(revDiscount)}</td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600">
                            +{formatINR(revDiscount - origDiscount)}
                          </td>
                        </tr>
                        <tr className="bg-slate-50/60 font-bold">
                          <td className="py-3.5 px-4 text-slate-900">Total Net Amount</td>
                          <td className="py-3.5 px-4 text-slate-900">{formatINR(origTotal)}</td>
                          <td className="py-3.5 px-4 text-[#3568ed] text-sm">{formatINR(revTotal)}</td>
                          <td className={`py-3.5 px-4 text-right ${totalDiff < 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {totalDiff < 0 ? '-' : '+'}{formatINR(Math.abs(totalDiff))}
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Actions in Comparison Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToCompare(null)}
              >
                Close Comparison
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-700 border-rose-200 hover:bg-rose-50"
                onClick={() => {
                  const it = itemToCompare;
                  setItemToCompare(null);
                  setItemToReject(it);
                }}
              >
                Reject Revision
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  const it = itemToCompare;
                  setItemToCompare(null);
                  setItemToApprove(it);
                }}
              >
                Authorize &amp; Publish Revision V2
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
