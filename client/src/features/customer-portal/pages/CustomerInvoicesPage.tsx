import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, usePayInvoice } from '../hooks';
import {
  StatusBadge,
  CustomerLoadingState,
  CustomerEmptyState,
  CustomerErrorState,
  PayInvoiceModal,
} from '../components';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Receipt, Eye, CreditCard, Search, X } from 'lucide-react';
import { CustomerInvoice } from '../types';

const INVOICE_STATUS_TABS = [
  { label: 'All Invoices', value: 'ALL' },
  { label: 'Issued / Unpaid', value: 'ISSUED' },
  { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
];

export const CustomerInvoicesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<CustomerInvoice | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: result, isLoading, isError, refetch } = useInvoices({
    search: debouncedSearch.trim() || undefined,
    status: statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  const invoices = result?.items || [];
  const totalItems = result?.total || 0;
  const totalPages = result?.totalPages || 1;

  const payMutation = usePayInvoice(selectedInvoiceForPay?.id || '');

  const handlePay = (paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI') => {
    if (!selectedInvoiceForPay) return;
    payMutation.mutate(
      {
        amount: selectedInvoiceForPay.balanceDue,
        paymentMethod,
      },
      {
        onSuccess: () => {
          setSelectedInvoiceForPay(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">Invoices & Billing</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Review issued commercial tax invoices, balance settlements, and payment history.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
          <input
            type="text"
            placeholder="Search by invoice #, order #, or quote #..."
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

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {INVOICE_STATUS_TABS.map((tab) => {
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
        <CustomerLoadingState message="Loading your invoices..." />
      ) : isError ? (
        <CustomerErrorState onRetry={() => refetch()} />
      ) : invoices.length === 0 ? (
        <CustomerEmptyState
          title="No Invoices Found"
          description={
            debouncedSearch || statusFilter !== 'ALL'
              ? 'There are no invoices matching your search or filter criteria.'
              : 'There are currently no billing invoices issued for your account.'
          }
          icon={Receipt}
          actionText={debouncedSearch || statusFilter !== 'ALL' ? 'Clear Filters' : undefined}
          onAction={
            debouncedSearch || statusFilter !== 'ALL'
              ? () => {
                  setSearch('');
                  setStatusFilter('ALL');
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
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Invoice #</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Order Ref</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Issue Date</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Due Date</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Total Amount</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Balance Due</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {invoices.map((inv) => {
                  const hasBalance = parseFloat(inv.balanceDue) > 0;
                  return (
                    <tr key={inv.id} className="transition hover:bg-[#fcfdff]">
                      <td className="py-4 px-6">
                        <Link
                          to={`/customer/invoices/${inv.id}`}
                          className="font-bold text-[#3568ed] hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#17213a]">
                        <Link
                          to={`/customer/orders/${inv.orderId}`}
                          className="text-[#647592] hover:text-[#3568ed]"
                        >
                          {inv.orderNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#17213a]">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 font-medium text-[#17213a]">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-[#17213a]">
                        ₹ {parseFloat(inv.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold">
                        {hasBalance ? (
                          <span className="text-amber-600">
                            ₹ {parseFloat(inv.balanceDue).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600">₹ 0.00</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {hasBalance && (
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForPay(inv)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#3568ed] px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-[#3568ed]/20 transition hover:bg-[#274fc1] cursor-pointer"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Pay</span>
                            </button>
                          )}
                          <Link
                            to={`/customer/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#3568ed] shadow-sm transition hover:bg-[#edf4ff] hover:border-[#3568ed]/40 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              itemLabel="invoices"
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedInvoiceForPay && (
        <PayInvoiceModal
          isOpen={Boolean(selectedInvoiceForPay)}
          onClose={() => setSelectedInvoiceForPay(null)}
          onPay={handlePay}
          invoice={selectedInvoiceForPay}
          isProcessing={payMutation.isPending}
        />
      )}
    </div>
  );
};
