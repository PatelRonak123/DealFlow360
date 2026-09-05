import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, PlusCircle, Phone, Mail, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_CUSTOMERS } from '../data/customerData';
import { formatINR } from '@/utils/formatters';

export const CustomersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredCustomers = INITIAL_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            Customer Accounts
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            View enterprise accounts, governance tiers, standard discount allowances, and credit lines.
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

      {/* Search Input */}
      <div className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder="Search accounts by name, industry, or contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {/* Customer Accounts Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} hoverable className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#3568ed]">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#17213a]">{customer.name}</h3>
                    <span className="text-[11px] text-[#71809f]">{customer.industry}</span>
                  </div>
                </div>
                <Badge
                  variant={
                    customer.tier === 'Gold'
                      ? 'gold'
                      : customer.tier === 'Silver'
                      ? 'silver'
                      : 'bronze'
                  }
                  size="sm"
                >
                  {customer.tier} Tier
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs border-t border-gray-100 pt-3 text-gray-600">
                <div className="flex items-center gap-2 text-[11px]">
                  <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{customer.address}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#f8faff] border border-[#eef2fc] p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tier Discount Policy:</span>
                  <strong className="text-emerald-600 font-bold">
                    Up to {customer.discountAllowancePercent}%
                  </strong>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-500">Payment Terms:</span>
                  <strong className="text-gray-800 font-semibold">{customer.paymentTerms}</strong>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-500">Credit Limit:</span>
                  <strong className="text-gray-800 font-semibold">{formatINR(customer.creditLimit)}</strong>
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
                Create Quote for {customer.name.split(' ')[0]}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
