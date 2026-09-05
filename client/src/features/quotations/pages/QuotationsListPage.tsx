import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  FileText,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuotationsList, useSubmitQuotationMutation } from '../hooks/useQuotationsQuery';
import { BackendQuotation, BackendQuotationStatus } from '../types/quotationApi.types';
import { formatINR, formatDate } from '@/utils/formatters';

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Approval Submission State
  const [selectedQuoteForApproval, setSelectedQuoteForApproval] = useState<BackendQuotation | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const submitMutation = useSubmitQuotationMutation();

  const handleOpenApprovalModal = (quote: BackendQuotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQuoteForApproval(quote);
    setApprovalNotes('');
    setSubmitError(null);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedQuoteForApproval) return;
    setSubmitError(null);

    try {
      await submitMutation.mutateAsync({
        id: selectedQuoteForApproval.id,
        payload: {
          notes: approvalNotes.trim() || undefined,
        },
      });

      const quoteNum = selectedQuoteForApproval.quotationNumber;
      setSelectedQuoteForApproval(null);
      setSuccessBanner(`Quotation ${quoteNum} was successfully submitted for approval.`);
      setTimeout(() => {
        setSuccessBanner(null);
      }, 6000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setSubmitError(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to submit quotation for approval. Please check quotation lines and discounts.'
      );
    }
  };

  const debouncedSearch = useDebounce(searchQuery, 300);

  const queryParams = {
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch.trim() || undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as BackendQuotationStatus) : undefined,
  };

  const { data, isLoading, isError, error, refetch } = useQuotationsList(queryParams);
  const quotations = data?.items || [];

  const statusVariantMap: Record<
    string,
    'draft' | 'pending' | 'approved' | 'negotiating' | 'won' | 'rejected' | 'default'
  > = {
    DRAFT: 'draft',
    PENDING_MANAGER_APPROVAL: 'pending',
    PENDING_FINANCE_APPROVAL: 'pending',
    APPROVED: 'approved',
    SENT: 'negotiating',
    REJECTED: 'rejected',
    CANCELLED: 'rejected',
    EXPIRED: 'default',
  };

  const statusLabelMap: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_MANAGER_APPROVAL: 'Manager Approval Pending',
    PENDING_FINANCE_APPROVAL: 'Finance Approval Pending',
    APPROVED: 'Approved',
    SENT: 'Sent to Customer',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            Quotations &amp; Proposals
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Manage, govern, and submit commercial CPQ quotations.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={() => navigate('/quotations/new')}
        >
          Create New Quotation
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        {/* Search Input */}
        <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search by quote number or customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'PENDING_MANAGER_APPROVAL', label: 'Manager Review' },
            { id: 'PENDING_FINANCE_APPROVAL', label: 'Finance Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'SENT', label: 'Sent' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.id);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-[#3568ed] text-white font-semibold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-[#3568ed] mb-3" />
              <p className="text-sm font-semibold text-[#17213a]">Loading quotations...</p>
              <p className="text-xs text-[#71809f]">Fetching live quotations from backend.</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-sm font-semibold text-red-700">Failed to load quotations</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">
                {(error as Error)?.message || 'An unexpected error occurred while fetching quotations.'}
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-sm font-bold text-[#17213a]">No quotations found</h3>
              <p className="mt-1 text-xs text-gray-400 max-w-sm">
                {searchQuery || selectedStatus !== 'all'
                  ? 'No quotations match the selected filters. Try clearing your search.'
                  : 'You have not created any quotations yet. Click below to start your first CPQ quote.'}
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                leftIcon={<PlusCircle className="h-4 w-4" />}
                onClick={() => navigate('/quotations/new')}
              >
                Create Quotation
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="py-3 px-6 font-semibold">Quotation Number</th>
                    <th className="py-3 font-semibold">Customer</th>
                    <th className="py-3 font-semibold">Total Amount</th>
                    <th className="py-3 font-semibold">Discount</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 font-semibold">Created Date</th>
                    <th className="py-3 font-semibold">Expiry Date</th>
                    <th className="py-3 px-6 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {quotations.map((quote) => {
                    const totalNum = parseFloat(String(quote.totalAmount)) || 0;
                    const discountNum = parseFloat(String(quote.discountAmount)) || 0;
                    const customerName = quote.customer?.companyName || 'Unassigned Customer';

                    return (
                      <tr
                        key={quote.id}
                        onClick={() => navigate(`/quotations/${quote.id}`)}
                        className="group hover:bg-[#f8faff] transition cursor-pointer"
                      >
                        <td className="py-3.5 px-6 font-bold text-[#3568ed]">
                          {quote.quotationNumber}
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-[#17213a]">{customerName}</p>
                          {quote.customer?.customerTier && (
                            <span className="text-[10px] text-gray-400">
                              Tier: {quote.customer.customerTier.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 font-bold text-[#17213a]">
                          {formatINR(totalNum)}
                        </td>
                        <td className="py-3.5 font-medium text-amber-700">
                          {discountNum > 0 ? formatINR(discountNum) : '—'}
                        </td>
                        <td className="py-3.5">
                          <Badge variant={statusVariantMap[quote.status] || 'default'} size="sm">
                            {statusLabelMap[quote.status] || quote.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-gray-500">
                          {formatDate(quote.createdAt)}
                        </td>
                        <td className="py-3.5 text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>{formatDate(quote.expiryDate)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {quote.status === 'DRAFT' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-[11px] font-semibold text-[#3568ed] border-[#3568ed]/30 hover:bg-[#3568ed]/10 transition-colors"
                                onClick={(e) => handleOpenApprovalModal(quote, e)}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Send for Approval
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/quotations/${quote.id}`);
                              }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-[#3568ed] transition"
                              title="Open Quotation"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="border-t border-[#eef2f9] px-6 py-4 bg-[#fbfcfe]">
              <Pagination
                currentPage={currentPage}
                totalPages={data?.totalPages || 1}
                totalItems={data?.total || 0}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[10, 20, 50]}
                itemLabel="quotations"
                isLoading={isLoading}
              />
            </div>
          </>
        )}
        </CardContent>
      </Card>

      {/* Send for Approval Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedQuoteForApproval)}
        onClose={() => {
          if (!submitMutation.isPending) {
            setSelectedQuoteForApproval(null);
          }
        }}
        title="Submit Quotation for Approval"
        description="Verify commercial terms before routing to management."
        maxWidth="md"
      >
        {selectedQuoteForApproval && (
          <div className="space-y-4">
            {submitError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="rounded-xl border border-[#e2e8f5] bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Quotation ID:</span>
                <span className="font-bold text-[#17213a]">{selectedQuoteForApproval.quotationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-[#17213a]">
                  {selectedQuoteForApproval.customer?.companyName || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Net Amount:</span>
                <span className="font-bold text-[#17213a]">
                  {formatINR(parseFloat(String(selectedQuoteForApproval.totalAmount)) || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Discount:</span>
                <span className="font-medium text-amber-700">
                  {parseFloat(String(selectedQuoteForApproval.discountAmount)) > 0
                    ? formatINR(parseFloat(String(selectedQuoteForApproval.discountAmount)))
                    : '₹0 (Standard Pricing)'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17213a] mb-1.5">
                Submission Notes / Justification (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add commercial justification, competitive pricing context, or special customer conditions..."
                rows={3}
                disabled={submitMutation.isPending}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-[#17213a] placeholder:text-gray-400 focus:border-[#3568ed] focus:outline-none focus:ring-2 focus:ring-[#3568ed]/15 transition resize-none disabled:bg-gray-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedQuoteForApproval(null)}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmSubmit}
                disabled={submitMutation.isPending}
                leftIcon={
                  submitMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )
                }
              >
                {submitMutation.isPending ? 'Submitting...' : 'Confirm & Submit'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
