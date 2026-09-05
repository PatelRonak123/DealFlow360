import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts } from '../hooks/useProducts';
import { formatINR } from '@/utils/formatters';

export const ProductsCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const debouncedSearch = useDebounce(search, 300);

  // Fetch real products with server-side pagination and server-side search
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts({
    page: currentPage,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    isActive: true,
  });

  const products = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const startIdx = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, total);

  const getProductTypeLabel = (type?: string) => {
    switch (type) {
      case 'RECURRING':
        return 'SaaS Subscription';
      case 'SERVICE':
        return 'Professional Service';
      case 'ONE_TIME':
      default:
        return 'One-Time License';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            Product &amp; Services Catalog
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Browse hardware models, SaaS platform subscriptions, and professional engineering services.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={() => navigate('/quotations/new')}
        >
          Build New CPQ Quote
        </Button>
      </div>

      {/* Filter Bar - Search Only */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        <div className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between text-xs text-[#59657d] px-1">
        <span>
          Showing <strong className="text-[#17213a]">{total === 0 ? '0' : `${startIdx} to ${endIdx}`}</strong> of{' '}
          <strong className="text-[#17213a]">{total}</strong> products
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 transition cursor-pointer"
          title="Refresh products"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-rose-900">Failed to load product catalog</h4>
              <p className="mt-1 text-rose-700">
                {(error as Error)?.message || 'An unexpected error occurred while fetching products.'}
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

      {/* Products Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-8 space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-12 bg-gray-100 rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && !isError && products.length === 0 && (
            <div className="py-16 text-center text-xs text-gray-400">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3568ed] mb-3">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-[#17213a]">No products found</h3>
              <p className="mt-1 text-xs text-[#71809f]">
                {search ? `No products match "${search}".` : 'No active products available in this category.'}
              </p>
              {search && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setCurrentPage(1);
                    }}
                  >
                    Reset Search
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isLoading && !isError && products.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                      <th className="py-3 px-6 font-semibold">SKU &amp; Product</th>
                      <th className="py-3 font-semibold">Category</th>
                      <th className="py-3 font-semibold">Billing Model</th>
                      <th className="py-3 font-semibold">Base Price</th>
                      <th className="py-3 font-semibold">Currency</th>
                      <th className="py-3 font-semibold">Stock Availability</th>
                      <th className="py-3 font-semibold">Status</th>
                      <th className="py-3 px-6 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f5fb]">
                    {products.map((prod) => {
                      const basePriceNum = parseFloat(String(prod.basePrice)) || 0;
                      const categoryName = prod.category?.name || 'General';
                      const stockCount = prod.stock;

                      return (
                        <tr key={prod.id} className="hover:bg-[#f8faff] transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
                                <Package className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="font-bold text-[#17213a]">{prod.name}</p>
                                <span className="text-[10px] text-gray-400 font-mono">SKU: {prod.sku}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700 capitalize">
                              {categoryName}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="text-gray-600 font-medium">
                              {getProductTypeLabel(prod.productType)}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-[#17213a]">
                            {formatINR(basePriceNum)}
                          </td>
                          <td className="py-4 text-gray-500 font-mono font-semibold">
                            {prod.currency || 'INR'}
                          </td>
                          <td className="py-4">
                            {stockCount === undefined || stockCount === null ? (
                              <span className="text-gray-400 font-medium">N/A</span>
                            ) : stockCount === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                Out of Stock (0)
                              </span>
                            ) : stockCount <= 10 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Low Stock: {stockCount} left
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {stockCount} in stock
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              Active
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate('/quotations/new')}
                            >
                              Quote Item
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Server-Side Pagination */}
              <div className="border-t border-[#eef2f9] p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  itemLabel="products"
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
