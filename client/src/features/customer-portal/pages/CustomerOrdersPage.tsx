import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerOrders } from '../hooks';
import { StatusBadge, CustomerLoadingState, CustomerEmptyState, CustomerErrorState } from '../components';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Boxes, Truck, Search, X } from 'lucide-react';

const ORDER_STATUS_TABS = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Packed', value: 'PACKED' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
];

export const CustomerOrdersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data: result, isLoading, isError, refetch } = useCustomerOrders({
    search: debouncedSearch.trim() || undefined,
    status: statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  const orders = result?.items || [];
  const totalItems = result?.total || 0;
  const totalPages = result?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">My Orders</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Track warehouse processing, carrier dispatch, and fulfillment delivery milestones.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8491aa]" />
          <input
            type="text"
            placeholder="Search by order #, quote #, or item..."
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
          {ORDER_STATUS_TABS.map((tab) => {
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
        <CustomerLoadingState message="Loading your orders..." />
      ) : isError ? (
        <CustomerErrorState onRetry={() => refetch()} />
      ) : orders.length === 0 ? (
        <CustomerEmptyState
          title="No Orders Found"
          description={
            debouncedSearch || statusFilter !== 'ALL'
              ? 'There are no orders matching your search or filter criteria.'
              : 'You have not confirmed any quotations into active sales orders yet.'
          }
          icon={Boxes}
          actionText={debouncedSearch || statusFilter !== 'ALL' ? 'Clear Filters' : 'View Quotations'}
          actionHref={debouncedSearch || statusFilter !== 'ALL' ? undefined : '/customer/quotations'}
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
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Order #</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Quotation Ref</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Order Date</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Total Amount</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Fulfillment</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Payment</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-[#fcfdff]">
                    <td className="py-4 px-6">
                      <Link
                        to={`/customer/orders/${order.id}`}
                        className="font-bold text-[#3568ed] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-[#8491aa]">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </td>
                    <td className="py-4 px-6 font-medium text-[#17213a]">
                      <Link
                        to={`/customer/quotations/${order.quotationId}`}
                        className="text-[#647592] hover:text-[#3568ed]"
                      >
                        {order.quotationNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium text-[#17213a]">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-[#17213a]">
                      ₹ {parseFloat(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={order.fulfillmentStatus} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/customer/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#3568ed] shadow-sm transition hover:bg-[#edf4ff] hover:border-[#3568ed]/40 cursor-pointer"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Track Order</span>
                      </Link>
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
              itemLabel="orders"
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
