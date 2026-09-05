import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { quotationsApi } from '@/features/quotations/api/quotationsApi';
import { useQuotationsList } from '@/features/quotations/hooks/useQuotationsQuery';
import { BackendQuotationStatus } from '@/features/quotations/types/quotationApi.types';
import { formatINR, formatCompactINR, formatDate } from '@/utils/formatters';

export type PipelineStageKey =
  | 'draft'
  | 'approval'
  | 'approved'
  | 'sent'
  | 'negotiation'
  | 'won';

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
    description: 'Delivered to client',
    color: 'border-t-purple-500',
    borderClass: 'border-purple-400',
    backendStatuses: ['SENT'],
  },
  {
    id: 'negotiation',
    label: 'In Negotiation',
    description: 'Client counter-offer & revisions',
    color: 'border-t-blue-500',
    borderClass: 'border-blue-400',
    backendStatuses: ['NEGOTIATION'],
  },
  {
    id: 'won',
    label: 'Won Deals',
    description: 'Accepted & closed contracts',
    color: 'border-t-teal-500',
    borderClass: 'border-teal-400',
    backendStatuses: ['WON'],
  },
];

// Helper: Tier Badge Variant
const getTierBadgeVariant = (tierName?: string): 'gold' | 'silver' | 'bronze' | 'default' => {
  if (!tierName) return 'default';
  const lower = tierName.toLowerCase();
  if (lower.includes('gold')) return 'gold';
  if (lower.includes('silver')) return 'silver';
  if (lower.includes('bronze')) return 'bronze';
  return 'default';
};

// Helper: Status Badge Variant
const getStatusBadgeVariant = (
  status: BackendQuotationStatus
): 'draft' | 'pending' | 'approved' | 'negotiating' | 'won' | 'rejected' | 'default' => {
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
    case 'NEGOTIATION':
      return 'negotiating';
    case 'WON':
      return 'won';
    case 'REJECTED':
    case 'LOST':
    case 'CANCELLED':
      return 'rejected';
    case 'EXPIRED':
    default:
      return 'default';
  }
};

// Helper: Status Label
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
    case 'NEGOTIATION':
      return 'In Negotiation';
    case 'WON':
      return 'Won';
    case 'LOST':
      return 'Lost';
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

interface ColumnSummary {
  count: number;
  value: number;
  quoteIds: string[];
}

// -------------------------------------------------------------
// Dedicated Kanban Column Component (Per-Column Progressive Loading)
// -------------------------------------------------------------
interface KanbanColumnProps {
  col: PipelineStageConfig;
  debouncedSearch: string;
  expandedQuoteIds: Set<string>;
  onToggleQuote: (id: string) => void;
  onNavigate: (path: string) => void;
  onSummaryChange: (colId: string, summary: ColumnSummary) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  col,
  debouncedSearch,
  expandedQuoteIds,
  onToggleQuote,
  onNavigate,
  onSummaryChange,
}) => {
  const statusParam = col.backendStatuses.join(',');

  // Independent server-side infinite query for this column
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['kanban-column', col.id, debouncedSearch, statusParam],
    queryFn: async ({ pageParam = 1 }) => {
      return quotationsApi.getQuotations({
        page: pageParam,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
        status: statusParam,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  });

  const quotes = useMemo(() => data?.pages.flatMap((p) => p.items) || [], [data?.pages]);
  const totalItems = data?.pages[0]?.total ?? 0;
  const colTotalValue = useMemo(
    () => quotes.reduce((sum, q) => sum + (parseFloat(String(q.totalAmount)) || 0), 0),
    [quotes]
  );

  // Notify parent of count & value changes for top-bar summary
  useEffect(() => {
    onSummaryChange(col.id, {
      count: totalItems,
      value: colTotalValue,
      quoteIds: quotes.map((q) => q.id),
    });
  }, [col.id, totalItems, colTotalValue, quotes, onSummaryChange]);

  return (
    <div className="flex flex-col w-[320px] min-w-[320px] max-w-[340px] shrink-0 rounded-2xl border border-[#e7ebf7] bg-[#fbfcfe] p-4 min-h-[460px] transition-all shadow-2xs">
      {/* Column Stage Header */}
      <div className="mb-3 border-b border-[#eef2f9] pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#17213a]">{col.label}</span>
          <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-600">
            {quotes.length < totalItems ? `${quotes.length} of ${totalItems}` : totalItems}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-[#71809f]">
          <span>{col.description}</span>
          <span className="font-bold text-[#3568ed]">{formatCompactINR(colTotalValue)}</span>
        </div>
      </div>

      {/* Column Body */}
      <div className="flex-1 space-y-3">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-24 bg-white rounded-xl border border-gray-100 p-3" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <p className="font-semibold">Failed to load deals</p>
            <p className="mt-0.5 text-[11px]">{(error as Error)?.message || 'Network error'}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 text-[11px] font-bold text-rose-800 underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && quotes.length === 0 && (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-400">No quotes in this stage</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          quotes.map((quote) => {
            const isExpanded = expandedQuoteIds.has(quote.id);
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
                className={`rounded-xl border border-[#e4eaf6] bg-white shadow-[0_2px_8px_rgba(64,86,145,0.04)] hover:border-[#b8cbf5] hover:shadow-md transition-all ${col.color} border-t-4 overflow-hidden`}
              >
                {/* Clickable Header Row: Toggles Card Expansion */}
                <div
                  onClick={() => onToggleQuote(quote.id)}
                  className="p-3.5 cursor-pointer hover:bg-slate-50/70 transition select-none"
                  title="Click to expand/collapse deal details"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <h4 className="text-xs font-bold text-[#17213a] truncate" title={customerName}>
                        {customerName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {tierName && (
                        <Badge variant={tierBadge} size="sm">
                          {tierName}
                        </Badge>
                      )}
                      <span className="p-0.5 text-gray-400">
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-[#3568ed] transition-transform duration-200" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform duration-200" />
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-[#3568ed] shrink-0" />
                      <span className="text-xs font-bold text-[#3568ed]">
                        {quote.quotationNumber}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#17213a]">
                      {formatINR(amount)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Discount</span>
                    <span className={`text-[11px] font-semibold ${discount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {discount > 0 ? formatINR(discount) : '0%'}
                    </span>
                  </div>
                </div>

                {/* Collapsible Details Section with Smooth Animation */}
                <div
                  className={`transition-all duration-200 ease-in-out border-t border-[#f2f5fb] bg-slate-50/40 px-3.5 ${
                    isExpanded ? 'max-h-96 py-3 opacity-100' : 'max-h-0 py-0 opacity-0 overflow-hidden border-t-0'
                  }`}
                >
                  <p className="text-xs font-medium text-[#475467] line-clamp-2">
                    {quote.notes || `Commercial proposal for ${customerName}`}
                  </p>

                  {needsApproval && (
                    <div className="mt-2.5 rounded-lg bg-amber-50 border border-amber-200/80 p-2 text-[11px] text-amber-800">
                      <div className="flex items-center gap-1 font-semibold">
                        <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                        <span>{statusLabel}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-amber-700 leading-tight">
                        High discount requires discount governance evaluation.
                      </p>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {quote.expiryDate ? formatDate(quote.expiryDate) : '30 days'}
                    </span>
                    <Badge variant={statusVariant} size="sm">
                      {statusLabel}
                    </Badge>
                  </div>

                  {/* Card Action Button: stopPropagation prevents accidental toggle */}
                  <div className="mt-3 pt-2.5 border-t border-[#e9eef7]">
                    <Button
                      variant={quote.status === 'DRAFT' ? 'primary' : quote.status === 'NEGOTIATION' ? 'primary' : 'secondary'}
                      size="sm"
                      className="w-full text-xs"
                      leftIcon={<FileText className="h-3.5 w-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(`/quotations/${quote.id}`);
                      }}
                    >
                      {quote.status === 'DRAFT'
                        ? 'Open in Builder'
                        : quote.status === 'NEGOTIATION'
                        ? 'Negotiate & Revise'
                        : quote.status === 'SENT'
                        ? 'Review & Options'
                        : 'View Quote Details'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Per-Column "Load More" Button */}
        {!isLoading && !isError && (
          <div className="pt-2">
            {hasNextPage ? (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:border-[#3568ed] hover:text-[#3568ed] hover:bg-blue-50/50 shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#3568ed]" />
                    <span>Loading deals...</span>
                  </>
                ) : (
                  <>
                    <span>Load More ({totalItems - quotes.length} remaining)</span>
                  </>
                )}
              </button>
            ) : quotes.length > 0 ? (
              <div className="text-center py-2 text-[11px] font-medium text-gray-400">
                All {totalItems} deals loaded
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Main Pipeline Page Component (Defaults to List View)
// -------------------------------------------------------------
export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();

  // DEFAULT VIEW IS LIST (TABLE) AS REQUIRED
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Table Server-Side Pagination State
  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(10);

  // Kanban Card Expansion State (Set of Quotation IDs)
  const [expandedQuoteIds, setExpandedQuoteIds] = useState<Set<string>>(new Set());

  // Kanban Column Summaries for Top Metric Bar
  const [kanbanSummaries, setKanbanSummaries] = useState<Record<string, ColumnSummary>>({});

  const handleColumnSummaryChange = useCallback((colId: string, summary: ColumnSummary) => {
    setKanbanSummaries((prev) => {
      if (
        prev[colId]?.count === summary.count &&
        prev[colId]?.value === summary.value &&
        prev[colId]?.quoteIds?.length === summary.quoteIds.length
      ) {
        return prev;
      }
      return {
        ...prev,
        [colId]: summary,
      };
    });
  }, []);

  // Toggle individual card expansion
  const toggleQuoteExpand = useCallback((quoteId: string) => {
    setExpandedQuoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) next.delete(quoteId);
      else next.add(quoteId);
      return next;
    });
  }, []);

  // Compute all currently loaded quote IDs across visible Kanban columns
  const allLoadedKanbanQuoteIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(kanbanSummaries).forEach((s) => {
      ids.push(...s.quoteIds);
    });
    return ids;
  }, [kanbanSummaries]);

  // Determine if all currently loaded cards are expanded
  const areAllLoadedExpanded = useMemo(() => {
    if (allLoadedKanbanQuoteIds.length === 0) return false;
    return allLoadedKanbanQuoteIds.every((id) => expandedQuoteIds.has(id));
  }, [allLoadedKanbanQuoteIds, expandedQuoteIds]);

  // Toggle Expand All / Collapse All across all currently loaded cards
  const handleToggleAllCards = () => {
    if (areAllLoadedExpanded) {
      setExpandedQuoteIds(new Set());
    } else {
      setExpandedQuoteIds(new Set(allLoadedKanbanQuoteIds));
    }
  };

  // Reset expansion state when search or stage changes
  useEffect(() => {
    setExpandedQuoteIds(new Set());
  }, [debouncedSearch, filterStage]);

  // Query parameters for Table view
  const tableQueryParams = useMemo(() => {
    const search = debouncedSearch.trim() || undefined;

    let statusParam: string | undefined = undefined;
    if (filterStage === 'draft') statusParam = 'DRAFT';
    else if (filterStage === 'approval') statusParam = 'PENDING_MANAGER_APPROVAL,PENDING_FINANCE_APPROVAL';
    else if (filterStage === 'approved') statusParam = 'APPROVED';
    else if (filterStage === 'sent') statusParam = 'SENT';
    else if (filterStage === 'negotiation') statusParam = 'NEGOTIATION';
    else if (filterStage === 'won') statusParam = 'WON';
    else if (filterStage === 'closed') statusParam = 'LOST,REJECTED,CANCELLED,EXPIRED';
    else if (filterStage === 'attention') statusParam = 'PENDING_MANAGER_APPROVAL,PENDING_FINANCE_APPROVAL';

    return {
      page: tablePage,
      limit: tablePageSize,
      search,
      status: statusParam,
    };
  }, [tablePage, tablePageSize, debouncedSearch, filterStage]);

  // Fetch quotations for Table View
  const {
    data: tableData,
    isLoading: isTableLoading,
    isError: isTableError,
    error: tableError,
    refetch: refetchTable,
  } = useQuotationsList(viewMode === 'table' ? tableQueryParams : undefined);

  const tableQuotations = tableData?.items || [];
  const tableTotal = tableData?.total || 0;
  const tableTotalPages = tableData?.totalPages || 1;

  // Filter visible Kanban columns based on filterStage
  const visibleKanbanStages = useMemo(() => {
    if (filterStage === 'all') return PIPELINE_STAGES;
    if (filterStage === 'attention') {
      return PIPELINE_STAGES.filter((s) => s.id === 'approval');
    }
    if (filterStage === 'closed') return [];
    return PIPELINE_STAGES.filter((s) => s.id === filterStage);
  }, [filterStage]);

  // Top Metrics calculation
  const totalActiveDeals = useMemo(() => {
    if (viewMode === 'table') return tableTotal;
    return Object.entries(kanbanSummaries)
      .filter(([colId]) => visibleKanbanStages.some((s) => s.id === colId))
      .reduce((sum, [, s]) => sum + s.count, 0);
  }, [viewMode, tableTotal, kanbanSummaries, visibleKanbanStages]);

  const totalPipelineValue = useMemo(() => {
    if (viewMode === 'table') {
      return tableQuotations.reduce((sum, q) => sum + (parseFloat(String(q.totalAmount)) || 0), 0);
    }
    return Object.entries(kanbanSummaries)
      .filter(([colId]) => visibleKanbanStages.some((s) => s.id === colId))
      .reduce((sum, [, s]) => sum + s.value, 0);
  }, [viewMode, tableQuotations, kanbanSummaries, visibleKanbanStages]);

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
          {/* View Toggle: List (Default) vs Board */}
          <div className="flex items-center rounded-xl border border-[#e4e9f7] bg-[#f8faff] p-1">
            <button
              type="button"
              onClick={() => {
                setViewMode('table');
                setTablePage(1);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#3568ed] shadow-xs'
                  : 'text-[#59657d] hover:text-[#17213a]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
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

      {/* Filter Bar & Global Controls */}
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
            { id: 'negotiation', label: 'In Negotiation' },
            { id: 'won', label: 'Won' },
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

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Expand All / Collapse All for Kanban Board */}
          {viewMode === 'kanban' && allLoadedKanbanQuoteIds.length > 0 && (
            <button
              type="button"
              onClick={handleToggleAllCards}
              className="flex items-center gap-1.5 rounded-lg border border-[#d9e2f5] bg-[#f8faff] px-2.5 py-1 text-xs font-semibold text-[#3568ed] hover:bg-[#edf2fd] transition cursor-pointer shadow-2xs"
            >
              {areAllLoadedExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 text-[#3568ed]" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 text-[#3568ed]" />
                  <span>Expand All</span>
                </>
              )}
            </button>
          )}

          {viewMode === 'table' && (
            <button
              type="button"
              onClick={() => refetchTable()}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition cursor-pointer"
              title="Refresh pipeline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[#59657d]">
            <span>Active Deals:</span>
            <strong className="text-[#17213a]">{totalActiveDeals}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-[#59657d]">
            <span>Total Value:</span>
            <strong className="text-[#3568ed] font-bold">{formatINR(totalPipelineValue)}</strong>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Table View (DEFAULT) with Server-Side Pagination */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-sm">
          {isTableError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-rose-900">Failed to load deals</h4>
                  <p className="mt-1 text-rose-700">
                    {(tableError as Error)?.message || 'An unexpected error occurred.'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchTable()}>
                    Retry Connection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isTableLoading && (
            <div className="py-12 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-10 bg-gray-100 rounded-lg" />
              ))}
            </div>
          )}

          {!isTableLoading && !isTableError && tableQuotations.length === 0 && (
            <div className="py-16 text-center text-xs text-gray-400">
              No quotations found matching your current filter.
            </div>
          )}

          {!isTableLoading && !isTableError && tableQuotations.length > 0 && (
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
                    {tableQuotations.map((quote) => {
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
                  totalPages={tableTotalPages}
                  totalItems={tableTotal}
                  pageSize={tablePageSize}
                  onPageChange={setTablePage}
                  onPageSizeChange={(newSize) => {
                    setTablePageSize(newSize);
                    setTablePage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  itemLabel="deals"
                  isLoading={isTableLoading}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Board View (Kanban) with Scalable Per-Column Loading & Horizontal Scroll */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'kanban' && (
        <div className="flex gap-5 items-start overflow-x-auto pb-4 pt-1 px-0.5 scroll-smooth">
          {visibleKanbanStages.length === 0 ? (
            <div className="w-full py-16 text-center text-xs text-gray-400 bg-white rounded-2xl border border-[#e7ebf7]">
              No active Kanban columns for this filter.
            </div>
          ) : (
            visibleKanbanStages.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                debouncedSearch={debouncedSearch}
                expandedQuoteIds={expandedQuoteIds}
                onToggleQuote={toggleQuoteExpand}
                onNavigate={(path) => navigate(path)}
                onSummaryChange={handleColumnSummaryChange}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
