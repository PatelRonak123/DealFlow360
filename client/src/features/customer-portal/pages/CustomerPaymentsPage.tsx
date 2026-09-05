import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePayments } from '../hooks';
import { StatusBadge, CustomerLoadingState, CustomerEmptyState, CustomerErrorState } from '../components';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { CreditCard, ShieldCheck, Search, X } from 'lucide-react';

export const CustomerPaymentsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data: result, isLoading, isError, refetch } = usePayments({
    search: debouncedSearch.trim() || undefined,
    page: currentPage,
    limit: pageSize,
  });

  const payments = result?.items || [];
  const totalItems = result?.total || 0;
  const totalPages = result?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">Payment History</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Audited digital transaction logs and settlement references for completed invoices.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
          <input
            type="text"
            placeholder="Search by payment #, invoice #, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#e4e9f7] bg-[#f7f8ff] py-2 pl-10 pr-9 text-xs font-medium text-[#17213a] placeholder-[#8491aa] focus:border-[#3568ed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3568ed]/15 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <CustomerLoadingState message="Loading your payment transaction history..." />
      ) : isError ? (
        <CustomerErrorState onRetry={() => refetch()} />
      ) : payments.length === 0 ? (
        <CustomerEmptyState
          title="No Payments Recorded"
          description={
            debouncedSearch
              ? 'There are no payment settlements matching your search query.'
              : 'There are no payment settlements recorded on your account yet.'
          }
          icon={CreditCard}
          actionText={debouncedSearch ? 'Clear Search' : 'View Invoices'}
          actionHref={debouncedSearch ? undefined : '/customer/invoices'}
          onAction={
            debouncedSearch
              ? () => {
                  setSearch('');
                  setCurrentPage(1);
                }
              : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#e7ebf7] bg-white shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e7ebf7] bg-[#f8faff] text-[#647592]">
                <tr>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Payment #</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Invoice Ref</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Order Ref</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Date & Time</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Payment Method</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {payments.map((pay) => (
                  <tr key={pay.id} className="transition hover:bg-[#fcfdff]">
                    <td className="py-4 px-6 font-bold text-[#17213a]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>{pay.paymentNumber}</span>
                      </div>
                      <p className="text-[11px] text-[#8491aa] font-mono mt-0.5">
                        Ref: {pay.transactionReference}
                      </p>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      <Link
                        to={`/customer/invoices/${pay.invoiceId}`}
                        className="text-[#3568ed] hover:underline"
                      >
                        {pay.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium text-[#647592]">{pay.orderNumber}</td>
                    <td className="py-4 px-6 font-medium text-[#17213a]">
                      {new Date(pay.paidAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#17213a]">
                      {pay.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-[#17213a]">
                      ₹ {parseFloat(pay.amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={pay.status} />
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
              itemLabel="payments"
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
