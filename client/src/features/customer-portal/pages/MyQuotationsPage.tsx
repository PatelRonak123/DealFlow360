import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerQuotations } from '../hooks';
import { StatusBadge, CustomerLoadingState, CustomerEmptyState, CustomerErrorState } from '../components';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Eye, Tag, X } from 'lucide-react';

const STATUS_TABS = [
  { label: 'All Quotations', value: 'ALL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'In Negotiation', value: 'NEGOTIATION' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'Confirmed (Orders)', value: 'CONFIRMED' },
  { label: 'Expired', value: 'EXPIRED' },
];

export const MyQuotationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search query by 300ms to optimize API requests
  const debouncedSearch = useDebounce(search, 300);

  // Reset page to 1 whenever search query or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: result, isLoading, isError, refetch } = useCustomerQuotations({
    search: debouncedSearch.trim() || undefined,
    status: statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  const quotations = result?.items || [];
  const totalItems = result?.total || 0;
  const totalPages = result?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">My Quotations</h1>
          <p className="mt-1 text-sm text-[#647592]">
            Review, negotiate discount counters, and confirm approved commercial proposals.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-sm">
        {/* Debounced Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
          <input
            type="text"
            placeholder="Search by quote #, SKU, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#e4e9f7] bg-[#f7f8ff] py-2 pl-10 pr-9 text-xs font-medium text-[#17213a] placeholder-[#8491aa] focus:border-[#3568ed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3568ed]/15 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Tab Pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
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

      {/* Content */}
      {isLoading ? (
        <CustomerLoadingState message="Loading your commercial quotations..." />
      ) : isError ? (
        <CustomerErrorState onRetry={() => refetch()} />
      ) : quotations.length === 0 ? (
        <CustomerEmptyState
          title="No Quotations Found"
          description={
            debouncedSearch || statusFilter !== 'ALL'
              ? 'There are no quotations matching your active filters or search criteria.'
              : 'You do not have any commercial quotations created yet.'
          }
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('ALL');
            setCurrentPage(1);
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#e7ebf7] bg-white shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e7ebf7] bg-[#f8faff] text-[#647592]">
                <tr>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Quotation #</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Issue Date</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Valid Until</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Discount</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Total Amount</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {quotations.map((quote) => (
                  <tr key={quote.id} className="transition hover:bg-[#fcfdff]">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/customer/quotations/${quote.id}`}
                          className="font-bold text-[#3568ed] hover:underline"
                        >
                          {quote.quotationNumber}
                        </Link>
                        {quote.versionNumber && quote.versionNumber > 1 && (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            V{quote.versionNumber} Revised
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#8491aa]">
                        {quote.items.length} line {quote.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </td>
                    <td className="py-4 px-6 font-medium text-[#17213a]">
                      {new Date(quote.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-medium text-[#17213a]">
                      {new Date(quote.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      {quote.discountPercent > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          <Tag className="h-3 w-3" />
                          {quote.discountPercent}%
                        </span>
                      ) : (
                        <span className="text-[#8491aa]">0%</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-[#17213a]">
                      ₹ {parseFloat(quote.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/customer/quotations/${quote.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#3568ed] shadow-sm transition hover:bg-[#edf4ff] hover:border-[#3568ed]/40 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Quotation</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
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
              itemLabel="quotations"
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
