import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Handshake,
  Search,
  RefreshCw,
  AlertCircle,
  FileEdit,
  XCircle,
  CheckCircle2,
  Tag,
  ArrowRight,
  ExternalLink,
  Clock,
  Send,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useNegotiationsQuery,
  useDeclineNegotiationMutation,
  useCreateRevisionMutation,
} from '../hooks/useNegotiations';
import { NegotiationItem } from '../api/negotiationsApi';
import { formatINR, formatDate } from '@/utils/formatters';

const STATUS_TABS = [
  { label: 'All Requests', value: 'ALL' },
  { label: 'Pending Review', value: 'REQUESTED' },
  { label: 'Revision Created', value: 'REVISION_CREATED' },
  { label: 'Declined', value: 'DECLINED' },
  { label: 'Approved', value: 'APPROVED' },
];

export const NegotiationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [itemToDecline, setItemToDecline] = useState<NegotiationItem | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, isError, error, refetch } = useNegotiationsQuery({
    status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    search: debouncedSearch.trim() || undefined,
    page: currentPage,
    limit: pageSize,
  });

  const declineMutation = useDeclineNegotiationMutation();
  const createRevisionMutation = useCreateRevisionMutation();

  const allItems = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // KPIs
  const pendingCount = allItems.filter((i) => i.status === 'REQUESTED' || i.status === 'UNDER_REVIEW').length;
  const revisionCount = allItems.filter((i) => i.status === 'REVISION_CREATED').length;
  const declinedCount = allItems.filter((i) => i.status === 'DECLINED').length;
  const approvedCount = allItems.filter((i) => i.status === 'APPROVED').length;

  const handleOpenDeclineModal = (item: NegotiationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDecline(item);
    setDeclineReason('');
    setActionError(null);
  };

  const handleConfirmDecline = async () => {
    if (!itemToDecline) return;
    if (!declineReason.trim() || declineReason.trim().length < 3) {
      setActionError('Please provide a reason of at least 3 characters explaining why the negotiation is declined.');
      return;
    }
    setActionError(null);

    try {
      await declineMutation.mutateAsync({
        id: itemToDecline.id,
        repResponse: declineReason.trim(),
      });

      const quoteNum = itemToDecline.quotationNumber;
      setItemToDecline(null);
      setSuccessBanner(`Negotiation for ${quoteNum} has been declined. Original quotation remains customer-visible.`);
      setTimeout(() => setSuccessBanner(null), 6000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to decline negotiation request.'
      );
    }
  };

  const handleCreateRevision = async (item: NegotiationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const revised = await createRevisionMutation.mutateAsync(item.id);
      setSuccessBanner(`Internal Revision ${revised.quotationNumber} created successfully! Redirecting...`);
      setTimeout(() => {
        navigate(`/quotations/${revised.id}`);
      }, 1000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      alert(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to create revised quotation.'
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'UNDER_REVIEW':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'REVISION_CREATED':
        return <Badge variant="negotiating">Revision Created</Badge>;
      case 'DECLINED':
        return <Badge variant="rejected">Declined</Badge>;
      case 'APPROVED':
        return <Badge variant="approved">Approved</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
              <Handshake className="h-3.5 w-3.5" />
              Sales Commercial Negotiations
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17213a]">
            Customer Negotiation Requests
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Review customer counter-offers, decline with feedback, or generate revised quotation proposals for Sales Manager sign-off.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh Requests
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
            className="text-emerald-600 hover:text-emerald-800 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Needs Attention
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-900">{pendingCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Awaiting sales response</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Revisions Created
              </span>
              <FileEdit className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-900">{revisionCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">In Manager review</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-gradient-to-br from-white to-rose-50/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Declined
              </span>
              <XCircle className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-900">{declinedCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">V1 original preserved</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Approved Deals
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{approvedCount}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Visible to customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
          <input
            type="text"
            placeholder="Search by quote #, customer, message..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-[#e4e9f7] bg-[#f7f8ff] py-2 pl-10 pr-9 text-xs font-medium text-[#17213a] placeholder-[#8491aa] focus:border-[#3568ed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3568ed]/15 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => {
            const isSelected = selectedStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.value);
                  setCurrentPage(1);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#3568ed] text-white shadow-md shadow-[#3568ed]/20'
                    : 'bg-[#f7f8ff] text-[#647592] hover:bg-[#edf4ff] hover:text-[#3568ed]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Table */}
      <Card className="border border-[#e7ebf7] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-[#3568ed] mb-2" />
              <p className="text-sm font-semibold text-[#17213a]">Loading negotiations...</p>
            </div>
          ) : isError ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
              <p className="text-sm font-bold text-gray-800">Failed to load negotiations</p>
              <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <Handshake className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">No Negotiation Requests Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                {searchQuery || selectedStatus !== 'ALL'
                  ? 'No requests match your current filters.'
                  : 'Customer negotiation requests will appear here when clients submit counter-offers.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#e7ebf7] bg-[#f8faff] text-[#647592]">
                  <tr>
                    <th className="py-3.5 px-6 font-bold uppercase tracking-wider">Quotation</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Customer</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Original Terms</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Counter-Offer</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Customer Message</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Status</th>
                    <th className="py-3.5 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f3fa]">
                  {allItems.map((item) => {
                    const isPending = item.status === 'REQUESTED' || item.status === 'UNDER_REVIEW';
                    const hasRevision = Boolean(item.revisedQuotationId);

                    return (
                      <tr key={item.id} className="transition hover:bg-[#fcfdff]">
                        {/* Quotation Number & Version */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/quotations/${item.quotationId}`}
                              className="font-bold text-[#3568ed] hover:underline inline-flex items-center gap-1"
                            >
                              {item.quotationNumber}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                              V{item.quotationVersionNumber || 1}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Created {formatDate(item.createdAt)}
                          </p>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-[#17213a]">{item.customerName}</p>
                          <p className="text-[11px] text-gray-500">{item.customerEmail}</p>
                        </td>

                        {/* Original Terms */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-800">
                            {formatINR(parseFloat(item.quotationTotalAmount))}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Subtotal: {formatINR(parseFloat(item.quotationSubtotal))}
                          </p>
                        </td>

                        {/* Counter-Offer */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                              <Tag className="h-3 w-3" />
                              {item.requestedDiscountPercent}% requested
                            </span>
                          </div>
                          {item.requestedDiscountPercent > 20 && (
                            <span className="mt-1 inline-block text-[10px] font-semibold text-rose-600">
                              Requires Finance sign-off
                            </span>
                          )}
                        </td>

                        {/* Customer Message & Requested Changes */}
                        <td className="py-4 px-4 max-w-xs">
                          <p className="truncate font-medium text-gray-700" title={item.customerMessage}>
                            "{item.customerMessage}"
                          </p>
                          {item.requestedChanges && item.requestedChanges.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.requestedChanges.slice(0, 2).map((c, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-medium text-blue-700"
                                >
                                  {c}
                                </span>
                              ))}
                              {item.requestedChanges.length > 2 && (
                                <span className="text-[10px] text-gray-400">
                                  +{item.requestedChanges.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(item.status)}
                          {item.repResponse && (
                            <p className="mt-1 text-[11px] text-gray-500 italic max-w-xs truncate" title={item.repResponse}>
                              Rep: "{item.repResponse}"
                            </p>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {isPending && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-[11px] font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                                  onClick={(e) => handleOpenDeclineModal(item, e)}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                                  Decline
                                </Button>

                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 px-2.5 text-[11px] font-semibold"
                                  disabled={createRevisionMutation.isPending}
                                  onClick={(e) => handleCreateRevision(item, e)}
                                >
                                  <FileEdit className="h-3.5 w-3.5 mr-1" />
                                  Create Revision V2
                                </Button>
                              </>
                            )}

                            {hasRevision && (
                              <Link
                                to={`/quotations/${item.revisedQuotationId}`}
                                className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                              >
                                <span>View {item.revisedQuotationNumber || 'Revision'}</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            )}

                            {!isPending && !hasRevision && (
                              <Link
                                to={`/quotations/${item.quotationId}`}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                              >
                                View Quote
                              </Link>
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

          {/* Pagination */}
          <div className="border-t border-[#e7ebf7] bg-[#f8faff]/70 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="negotiation requests"
              isLoading={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Decline Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDecline)}
        onClose={() => {
          if (!declineMutation.isPending) {
            setItemToDecline(null);
          }
        }}
        title="Decline Negotiation Request"
        description="Provide a polite explanation to the customer. The original quotation will remain active for acceptance."
        maxWidth="md"
      >
        {itemToDecline && (
          <div className="space-y-4">
            {actionError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Quotation:</span>
                <span className="font-bold text-gray-900">{itemToDecline.quotationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-900">{itemToDecline.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Requested Discount:</span>
                <span className="font-bold text-amber-700">{itemToDecline.requestedDiscountPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer Note:</span>
                <span className="font-medium text-gray-800">"{itemToDecline.customerMessage}"</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Explanation / Counter Feedback to Customer <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Due to standard manufacturer minimum margin limits, we cannot offer 15% discount for current order volumes. However, our original proposal of 10% discount remains valid for immediate confirmation."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-gray-800 placeholder-gray-400 focus:border-[#3568ed] focus:outline-none focus:ring-2 focus:ring-[#3568ed]/15 transition"
              />
              <p className="text-[11px] text-gray-500">
                This response will be visible to the customer in their Customer Portal. Original terms remain active.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                disabled={declineMutation.isPending}
                onClick={() => setItemToDecline(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                disabled={declineMutation.isPending || !declineReason.trim()}
                onClick={handleConfirmDecline}
                leftIcon={<Send className="h-3.5 w-3.5" />}
              >
                {declineMutation.isPending ? 'Sending...' : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
