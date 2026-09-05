import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Kanban as KanbanIcon,
  List,
  PlusCircle,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  RefreshCw,
  AlertCircle,
  Search,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuotationsList } from '@/features/quotations/hooks/useQuotationsQuery';
import { BackendQuotationStatus } from '@/features/quotations/types/quotationApi.types';
import { formatINR, formatCompactINR, formatDate } from '@/utils/formatters';

export type PipelineStageKey = 'draft' | 'approval' | 'approved' | 'sent';

export interface PipelineStageConfig {
  id: PipelineStageKey;
  label: string;
  description: string;
  color: string;
  borderClass: string;
  backendStatuses: BackendQuotationStatus[];
}

const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'draft',
    label: 'Draft Quotes',
    description: 'Scoping & CPQ line items',
    color: 'border-t-slate-400',
    borderClass: 'border-slate-300',
    backendStatuses: ['DRAFT'],
  },
  {
    id: 'approval',
    label: 'Approval Review',
    description: 'Discount governance evaluation',
    color: 'border-t-amber-500',
    borderClass: 'border-amber-400',
    backendStatuses: ['PENDING_MANAGER_APPROVAL', 'PENDING_FINANCE_APPROVAL'],
  },
  {
    id: 'approved',
    label: 'Approved',
    description: 'Governed & ready for client',
    color: 'border-t-emerald-500',
    borderClass: 'border-emerald-400',
    backendStatuses: ['APPROVED'],
  },
  {
    id: 'sent',
    label: 'Sent to Customer',
    description: 'Customer review & negotiation',
    color: 'border-t-purple-500',
    borderClass: 'border-purple-400',
    backendStatuses: ['SENT'],
  },
];

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(10);

  // Determine query parameters based on active view mode
  const queryParams = useMemo(() => {
    const search = debouncedSearch.trim() || undefined;
    if (viewMode === 'kanban') {
      return {
        page: 1,
        limit: 100,
        search,
      };
    }

    let statusParam: string | undefined = undefined;
    if (filterStage === 'draft') statusParam = 'DRAFT';
    else if (filterStage === 'approval') statusParam = 'PENDING_MANAGER_APPROVAL,PENDING_FINANCE_APPROVAL';
    else if (filterStage === 'approved') statusParam = 'APPROVED';
    else if (filterStage === 'sent') statusParam = 'SENT';
    else if (filterStage === 'closed') statusParam = 'REJECTED,CANCELLED,EXPIRED';
    else if (filterStage === 'attention') statusParam = 'PENDING_MANAGER_APPROVAL,PENDING_FINANCE_APPROVAL';

    return {
      page: tablePage,
      limit: tablePageSize,
      search,
      status: statusParam,
    };
  }, [viewMode, tablePage, tablePageSize, debouncedSearch, filterStage]);

  // Fetch real quotations from backend
  const { data, isLoading, isError, error, refetch } = useQuotationsList(queryParams);

  const quotations = useMemo(() => data?.items || [], [data?.items]);

  // Map backend status to pipeline stage key
  const getStageForQuotation = (status: BackendQuotationStatus): PipelineStageKey | 'closed' => {
    switch (status) {
      case 'DRAFT':
        return 'draft';
      case 'PENDING_MANAGER_APPROVAL':
      case 'PENDING_FINANCE_APPROVAL':
        return 'approval';
      case 'APPROVED':
        return 'approved';
      case 'SENT':
        return 'sent';
      case 'REJECTED':
      case 'CANCELLED':
      case 'EXPIRED':
      default:
        return 'closed';
    }
  };

  // Filtered quotations for Kanban view (in-memory partition across the 4 stage columns)
  const kanbanFilteredQuotations = useMemo(() => {
    return quotations.filter((quote) => {
      const stage = getStageForQuotation(quote.status);
      if (filterStage === 'all') {
        // By default show active pipeline (exclude closed/cancelled/expired unless specifically requested)
        return stage !== 'closed';
      }
      if (filterStage === 'attention') {
        return (
          quote.status === 'PENDING_MANAGER_APPROVAL' ||
          quote.status === 'PENDING_FINANCE_APPROVAL' ||
          Number(quote.discountAmount) > 0
        );
      }
      if (filterStage === 'closed') {
        return stage === 'closed';
      }
      return stage === filterStage;
    });
  }, [quotations, filterStage]);

  const displayedQuotations = viewMode === 'kanban' ? kanbanFilteredQuotations : quotations;

  const totalValue = useMemo(
    () => displayedQuotations.reduce((sum, q) => sum + (parseFloat(String(q.totalAmount)) || 0), 0),
    [displayedQuotations]
  );

  const getTierBadgeVariant = (tierName?: string): 'gold' | 'silver' | 'bronze' | 'default' => {
    if (!tierName) return 'default';
    const lower = tierName.toLowerCase();
    if (lower.includes('gold')) return 'gold';
    if (lower.includes('silver')) return 'silver';
    if (lower.includes('bronze')) return 'bronze';
    return 'default';
  };

  const getStatusBadgeVariant = (
    status: BackendQuotationStatus
  ): 'draft' | 'pending' | 'approved' | 'negotiating' | 'rejected' | 'default' => {
    switch (status) {
      case 'DRAFT':
        return 'draft';
      case 'PENDING_MANAGER_APPROVAL':
      case 'PENDING_FINANCE_APPROVAL':
        return 'pending';
      case 'APPROVED':
        return 'approved';
      case 'SENT':
        return 'negotiating';
      case 'REJECTED':
      case 'CANCELLED':
        return 'rejected';
      case 'EXPIRED':
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: BackendQuotationStatus): string => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'PENDING_MANAGER_APPROVAL':
        return 'Pending Manager';
      case 'PENDING_FINANCE_APPROVAL':
        return 'Pending Finance';
      case 'APPROVED':
        return 'Approved';
      case 'SENT':
        return 'Sent to Client';
      case 'REJECTED':
        return 'Rejected';
      case 'CANCELLED':
        return 'Cancelled';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            My Deals &amp; Pipeline
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Manage your opportunities, track deal health, and generate governed CPQ quotations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-[#e4e9f7] bg-[#f8faff] p-1">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#3568ed] shadow-xs'
                  : 'text-[#59657d] hover:text-[#17213a]'
              }`}
            >
              <KanbanIcon className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#3568ed] shadow-xs'
                  : 'text-[#59657d] hover:text-[#17213a]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>

          <Button
            variant="primary"
            leftIcon={<PlusCircle className="h-4 w-4" />}
            onClick={() => navigate('/quotations/new')}
          >
            Create Quote
          </Button>
        </div>
      </div>

      {/* Filter Bar & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="flex h-9 w-60 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition mr-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search quote or customer..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTablePage(1);
              }}
              className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-[#71809f] mr-1">
            Filter:
          </span>
          {[
            { id: 'all', label: 'All Active' },
            { id: 'attention', label: 'Governance Review' },
            { id: 'draft', label: 'Drafts' },
            { id: 'approval', label: 'Pending Approval' },
            { id: 'approved', label: 'Approved' },
            { id: 'sent', label: 'Sent' },
            { id: 'closed', label: 'Closed / Inactive' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilterStage(tab.id);
                setTablePage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                filterStage === tab.id
                  ? 'bg-[#3568ed] text-white font-semibold shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition"
            title="Refresh pipeline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-1.5 text-[#59657d]">
            <span>Active Deals:</span>
            <strong className="text-[#17213a]">
              {viewMode === 'kanban' ? kanbanFilteredQuotations.length : (data?.total ?? quotations.length)}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 text-[#59657d]">
            <span>Total Value:</span>
            <strong className="text-[#3568ed] font-bold">{formatINR(totalValue)}</strong>
          </div>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-rose-900">Failed to load pipeline data</h4>
              <p className="mt-1 text-rose-700">
                {(error as Error)?.message || 'An unexpected error occurred while fetching deals.'}
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-2xl border border-[#e7ebf7] bg-[#fbfcfe] p-4 min-h-[400px] animate-pulse"
            >
              <div className="h-6 w-24 bg-gray-200 rounded mb-3" />
              <div className="space-y-3 flex-1">
                <div className="h-28 bg-white rounded-xl border border-gray-100 p-3" />
                <div className="h-28 bg-white rounded-xl border border-gray-100 p-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board View */}
      {!isLoading && !isError && viewMode === 'kanban' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PIPELINE_STAGES.map((col) => {
            const colQuotes = kanbanFilteredQuotations.filter((q) =>
              col.backendStatuses.includes(q.status)
            );
            const colTotal = colQuotes.reduce(
              (sum, q) => sum + (parseFloat(String(q.totalAmount)) || 0),
              0
            );

            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl border border-[#e7ebf7] bg-[#fbfcfe] p-4 min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="mb-3 border-b border-[#eef2f9] pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#17213a]">{col.label}</span>
                    <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-600">
                      {colQuotes.length}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#71809f]">
                    <span>{col.description}</span>
                    <span className="font-bold text-[#3568ed]">{formatCompactINR(colTotal)}</span>
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="flex-1 space-y-3">
                  {colQuotes.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-4 text-center">
                      <p className="text-xs text-gray-400">No quotes in this stage</p>
                    </div>
                  ) : (
                    colQuotes.map((quote) => {
                      const customerName = quote.customer?.companyName || 'Enterprise Account';
                      const tierName = quote.customer?.customerTier?.name;
                      const tierBadge = getTierBadgeVariant(tierName);
                      const amount = parseFloat(String(quote.totalAmount)) || 0;
                      const discount = parseFloat(String(quote.discountAmount)) || 0;
                      const statusVariant = getStatusBadgeVariant(quote.status);
                      const statusLabel = getStatusLabel(quote.status);

                      const needsApproval =
                        quote.status === 'PENDING_MANAGER_APPROVAL' ||
                        quote.status === 'PENDING_FINANCE_APPROVAL';

                      return (
                        <div
                          key={quote.id}
                          className={`rounded-xl border border-[#e4eaf6] bg-white p-4 shadow-[0_4px_12px_rgba(64,86,145,0.04)] hover:border-[#b8cbf5] hover:shadow-md transition-all ${col.color} border-t-4`}
                        >
                          {/* Header: Customer & Tier */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <h4 className="text-xs font-bold text-[#17213a] truncate" title={customerName}>
                                {customerName}
                              </h4>
                            </div>
                            {tierName && (
                              <Badge variant={tierBadge} size="sm">
                                {tierName}
                              </Badge>
                            )}
                          </div>

                          {/* Quote Number & Notes */}
                          <div className="mt-2">
                            <div className="flex items-center gap-1.5">
                              <Tag className="h-3 w-3 text-[#3568ed] shrink-0" />
                              <span className="text-xs font-bold text-[#3568ed]">
                                {quote.quotationNumber}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-[#475467] line-clamp-2">
                              {quote.notes || `Commercial proposal for ${customerName}`}
                            </p>
                          </div>

                          {/* Amount & Discount */}
                          <div className="mt-3 flex items-center justify-between border-t border-[#f2f5fb] pt-2.5">
                            <div>
                              <span className="text-[10px] text-gray-400 block uppercase">Quote Value</span>
                              <span className="text-sm font-bold text-[#17213a]">
                                {formatINR(amount)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-gray-400 block uppercase">Discount</span>
                              <span className={`text-xs font-bold ${discount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                                {discount > 0 ? formatINR(discount) : '0%'}
                              </span>
                            </div>
                          </div>

                          {/* Governance Review Callout if pending approval */}
                          {needsApproval && (
                            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200/80 p-2 text-[11px] text-amber-800">
                              <div className="flex items-center gap-1 font-semibold">
                                <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                                <span>{statusLabel}</span>
                              </div>
                              <p className="mt-0.5 text-[10px] text-amber-700 leading-tight">
                                High discount requires discount governance evaluation.
                              </p>
                            </div>
                          )}

                          {/* Expiry Date */}
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expires: {quote.expiryDate ? formatDate(quote.expiryDate) : '30 days'}
                            </span>
                            <Badge variant={statusVariant} size="sm">
                              {statusLabel}
                            </Badge>
                          </div>

                          {/* Card Actions */}
                          <div className="mt-3 border-t border-[#f2f5fb] pt-2.5">
                            <Button
                              variant={quote.status === 'DRAFT' ? 'primary' : 'secondary'}
                              size="sm"
                              className="w-full text-xs"
                              leftIcon={<FileText className="h-3.5 w-3.5" />}
                              onClick={() => navigate(`/quotations/${quote.id}`)}
                            >
                              {quote.status === 'DRAFT' ? 'Open in Builder' : 'View Quote Details'}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {!isLoading && !isError && viewMode === 'table' && (
        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-sm">
          {quotations.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No quotations found matching your current filter.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#eef2f9] text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                      <th className="pb-3 font-semibold">Quotation #</th>
                      <th className="pb-3 font-semibold">Customer &amp; Tier</th>
                      <th className="pb-3 font-semibold">Stage / Status</th>
                      <th className="pb-3 font-semibold">Deal Value</th>
                      <th className="pb-3 font-semibold">Discount</th>
                      <th className="pb-3 font-semibold">Expiry Date</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f5fb]">
                    {quotations.map((quote) => {
                      const customerName = quote.customer?.companyName || 'Enterprise Account';
                      const tierName = quote.customer?.customerTier?.name;
                      const tierBadge = getTierBadgeVariant(tierName);
                      const amount = parseFloat(String(quote.totalAmount)) || 0;
                      const discount = parseFloat(String(quote.discountAmount)) || 0;
                      const statusVariant = getStatusBadgeVariant(quote.status);
                      const statusLabel = getStatusLabel(quote.status);

                      return (
                        <tr key={quote.id} className="hover:bg-[#f8faff] transition">
                          <td className="py-3.5">
                            <p className="font-bold text-[#3568ed]">{quote.quotationNumber}</p>
                            <span className="text-[10px] text-gray-400 truncate block max-w-[200px]">
                              {quote.notes || 'Commercial Proposal'}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{customerName}</span>
                              {tierName && (
                                <Badge variant={tierBadge} size="sm">
                                  {tierName}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <Badge variant={statusVariant} size="sm">
                              {statusLabel}
                            </Badge>
                          </td>
                          <td className="py-3.5 font-bold text-[#17213a]">
                            {formatINR(amount)}
                          </td>
                          <td className="py-3.5">
                            <span className={`font-semibold ${discount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                              {discount > 0 ? formatINR(discount) : '₹0'}
                            </span>
                          </td>
                          <td className="py-3.5 text-gray-500">
                            {quote.expiryDate ? formatDate(quote.expiryDate) : '—'}
                          </td>
                          <td className="py-3.5 text-right">
                            <Button
                              variant={quote.status === 'DRAFT' ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => navigate(`/quotations/${quote.id}`)}
                            >
                              {quote.status === 'DRAFT' ? 'Edit' : 'View'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Server-Side Pagination */}
              <div className="mt-4 border-t border-[#eef2f9] pt-4">
                <Pagination
                  currentPage={tablePage}
                  totalPages={data?.totalPages || 1}
                  totalItems={data?.total || 0}
                  pageSize={tablePageSize}
                  onPageChange={setTablePage}
                  onPageSizeChange={(newSize) => {
                    setTablePageSize(newSize);
                    setTablePage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  itemLabel="deals"
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

