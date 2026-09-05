import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  PlusCircle,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomers } from '../hooks/useCustomers';

export const CustomersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomers({
    page: currentPage,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    status: 'ACTIVE',
  });

  const customers = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const startIdx = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, total);

  const getTierBadgeVariant = (tierName?: string): 'gold' | 'silver' | 'bronze' | 'default' => {
    if (!tierName) return 'default';
    const lower = tierName.toLowerCase();
    if (lower.includes('gold')) return 'gold';
    if (lower.includes('silver')) return 'silver';
    if (lower.includes('bronze')) return 'bronze';
    return 'default';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            Customer Accounts
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            View enterprise accounts, governance tiers, and standard discount allowances.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={() => navigate('/quotations/new')}
        >
          Create Quote for Account
        </Button>
      </div>

      {/* Search Input & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts by company name, contact, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#59657d]">
          <span>
            Showing <strong className="text-[#17213a]">{total === 0 ? '0' : `${startIdx} to ${endIdx}`}</strong> of{' '}
            <strong className="text-[#17213a]">{total}</strong> active accounts
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 transition"
            title="Refresh accounts"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-rose-900">Failed to load customer accounts</h4>
              <p className="mt-1 text-rose-700">
                {(error as Error)?.message || 'An unexpected error occurred while fetching customer accounts.'}
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

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Card key={idx} className="animate-pulse space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded-full bg-gray-200" />
              </div>
              <div className="space-y-2 pt-3">
                <div className="h-3 w-48 rounded bg-gray-100" />
                <div className="h-3 w-36 rounded bg-gray-100" />
              </div>
              <div className="h-16 rounded-xl bg-gray-100" />
              <div className="h-9 rounded-xl bg-gray-200" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && customers.length === 0 && (
        <Card className="py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3568ed]">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-[#17213a]">No customer accounts found</h3>
          <p className="mt-1 text-xs text-[#71809f]">
            {search ? `No accounts matched "${search}". Try clearing your search filter.` : 'No active enterprise accounts registered in the database.'}
          </p>
          {search && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                Clear Search
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Real Customer Accounts Grid */}
      {!isLoading && !isError && customers.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer) => {
              const tierName = customer.customerTier?.name || 'Standard Tier';
              const tierBadge = getTierBadgeVariant(tierName);

              return (
                <Card key={customer.id} hoverable className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#3568ed]">
                          <Building2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#17213a] truncate" title={customer.companyName}>
                            {customer.companyName}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-[#71809f]">
                            <User className="h-3 w-3 shrink-0 text-gray-400" />
                            <span className="truncate">{customer.contactName || 'Primary Contact'}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={tierBadge} size="sm">
                        {tierName}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2 text-xs border-t border-gray-100 pt-3 text-gray-600">
                      <div className="flex items-center gap-2 text-[11px]">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={customer.email}>{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>{customer.phone || 'Phone not registered'}</span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-[#f8faff] border border-[#eef2fc] p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tier Governance:</span>
                        <strong className="text-blue-700 font-semibold">{tierName}</strong>
                      </div>
                      {customer.customerTier?.description && (
                        <p className="mt-1 text-[10px] text-gray-500 line-clamp-2">
                          {customer.customerTier.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between pt-2 border-t border-blue-100/60 text-[11px]">
                        <span className="text-gray-500">Account Status:</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <ShieldCheck className="h-3 w-3" />
                          {customer.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate(`/quotations/new?customerId=${customer.id}`)}
                    >
                      Create Quote for {customer.companyName.split(' ')[0]}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Server-Side Pagination */}
          <div className="rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
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
              itemLabel="accounts"
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
