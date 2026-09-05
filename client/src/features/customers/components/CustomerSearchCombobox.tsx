import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useCustomers, useCustomer } from '../hooks/useCustomers';
import { BackendCustomerSummary } from '@/features/quotations/types/quotationApi.types';
import { useDebounce } from '@/hooks/useDebounce';

export interface CustomerSearchComboboxProps {
  selectedCustomerId?: string;
  onSelectCustomer: (customer: BackendCustomerSummary | null) => void;
  disabled?: boolean;
}

export const CustomerSearchCombobox: React.FC<CustomerSearchComboboxProps> = ({
  selectedCustomerId,
  onSelectCustomer,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search by 300ms to avoid excessive API requests
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch single customer if selectedCustomerId is provided
  const { data: preselectedCustomer, isLoading: isPreselectedLoading } = useCustomer(
    selectedCustomerId || undefined
  );

  // Search active customers when dropdown is open and query has text
  const {
    data: searchResults,
    isLoading: isSearching,
    isError,
    error,
    refetch,
  } = useCustomers({
    search: debouncedSearch.trim() || undefined,
    limit: 10,
    status: 'ACTIVE',
  });

  const matchingCustomers = searchResults?.items || [];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    onSelectCustomer(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleSelect = (customer: BackendCustomerSummary) => {
    onSelectCustomer(customer);
    setSearchTerm('');
    setIsOpen(false);
  };

  const getTierVariant = (tierName?: string): 'gold' | 'silver' | 'bronze' | 'default' => {
    if (!tierName) return 'default';
    const lower = tierName.toLowerCase();
    if (lower.includes('gold')) return 'gold';
    if (lower.includes('silver')) return 'silver';
    if (lower.includes('bronze')) return 'bronze';
    return 'default';
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 1. Selected State Display */}
      {selectedCustomerId && preselectedCustomer ? (
        <div className="flex items-center justify-between rounded-xl border border-[#e2e8f5] bg-[#f8faff] p-3 text-xs transition">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#3568ed]">
              <Building2 className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#17213a] truncate">
                  {preselectedCustomer.companyName}
                </span>
                {preselectedCustomer.customerTier?.name && (
                  <Badge variant={getTierVariant(preselectedCustomer.customerTier.name)} size="sm">
                    {preselectedCustomer.customerTier.name}
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-[11px] truncate mt-0.5">
                {preselectedCustomer.contactName ? `${preselectedCustomer.contactName} • ` : ''}
                {preselectedCustomer.email}
              </p>
            </div>
          </div>

          {!disabled && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(true);
                  setSearchTerm('');
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[#3568ed] hover:bg-blue-50 transition cursor-pointer"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 transition cursor-pointer"
                title="Clear selected customer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : isPreselectedLoading && selectedCustomerId ? (
        /* Loading preselected customer skeleton */
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-gray-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-1/3 rounded bg-gray-200" />
            <div className="h-2.5 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
      ) : (
        /* 2. Unselected / Search Input State */
        <div>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search customer by company name, contact, or email..."
              disabled={disabled}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-xs text-[#17213a] placeholder:text-gray-400 focus:border-[#3568ed] focus:outline-none focus:ring-2 focus:ring-[#3568ed]/15 transition disabled:bg-gray-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 rounded-lg p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-gray-400 px-1">
            Start typing to search enterprise accounts in real time.
          </p>
        </div>
      )}

      {/* 3. Search Autocomplete Dropdown Popover */}
      {isOpen && !selectedCustomerId && (
        <div className="absolute top-full left-0 z-30 mt-1.5 w-full rounded-2xl border border-[#e2e8f5] bg-white shadow-xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin text-[#3568ed]" />
              <span>Searching customer accounts...</span>
            </div>
          ) : isError ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 font-semibold mb-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Unable to load customers</span>
              </div>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                {(error as Error)?.message || 'Check your connection and try again.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-xs font-semibold text-[#3568ed] hover:underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : matchingCustomers.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-1.5" />
              {debouncedSearch.trim() ? (
                <>
                  <p className="font-semibold text-[#17213a]">No customer accounts found</p>
                  <p className="mt-0.5 text-[11px]">
                    No accounts matching &ldquo;{debouncedSearch}&rdquo;
                  </p>
                </>
              ) : (
                <p>Start typing to search active customer accounts...</p>
              )}
            </div>
          ) : (
            <div className="p-1.5 divide-y divide-gray-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Matching Accounts ({matchingCustomers.length})
              </div>
              {matchingCustomers.map((customer) => {
                const tierName = customer.customerTier?.name;
                const tierVariant = getTierVariant(tierName);

                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className="flex w-full items-center justify-between p-2.5 rounded-xl text-left hover:bg-[#f8faff] transition cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17213a] group-hover:text-[#3568ed] transition-colors truncate">
                          {customer.companyName}
                        </span>
                        {tierName && (
                          <Badge variant={tierVariant} size="sm">
                            {tierName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {customer.contactName ? `${customer.contactName} • ` : ''}
                        {customer.email}
                      </p>
                    </div>

                    <div className="shrink-0 text-gray-300 group-hover:text-[#3568ed] transition-colors">
                      <Check className="h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
