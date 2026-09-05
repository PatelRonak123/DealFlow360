import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useQuotations } from '../store/quotationStore';
import { formatINR, formatPercent, formatDate } from '@/utils/formatters';

export const QuotationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { quotations } = useQuotations();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredQuotes = quotations.filter((quote) => {
    const matchesSearch =
      quote.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedStatus === 'all') return matchesSearch;
    return matchesSearch && quote.status === selectedStatus;
  });


  const statusVariantMap: Record<string, 'draft' | 'pending' | 'approved' | 'negotiating' | 'won' | 'rejected'> = {
    draft: 'draft',
    pending_approval: 'pending',
    approved: 'approved',
    in_negotiation: 'negotiating',
    under_reapproval: 'pending',
    closed_won: 'won',
    rejected: 'rejected',
  };

  const statusLabelMap: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    in_negotiation: 'In Negotiation',
    under_reapproval: 'Re-Approval Req.',
    closed_won: 'Closed Won',
    rejected: 'Rejected',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            Quotations &amp; Proposals
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Track, revise, and govern commercial CPQ quotes for your assigned accounts.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={() => navigate('/quotations/new')}
        >
          Create New Quotation
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        {/* Search */}
        <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search by quote ID or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'draft', label: 'Draft' },
            { id: 'pending_approval', label: 'Pending Approval' },
            { id: 'approved', label: 'Approved' },
            { id: 'in_negotiation', label: 'Negotiation' },
            { id: 'closed_won', label: 'Closed Won' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-[#3568ed] text-white font-semibold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                  <th className="py-3 px-6 font-semibold">Quote ID</th>
                  <th className="py-3 font-semibold">Customer</th>
                  <th className="py-3 font-semibold">Created Date</th>
                  <th className="py-3 font-semibold">Net Value</th>
                  <th className="py-3 font-semibold">Margin %</th>
                  <th className="py-3 font-semibold">Governance Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f5fb]">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-600 text-sm">No quotations found</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try modifying your search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      onClick={() => navigate(`/quotations/${quote.id}`)}
                      className="group hover:bg-[#f8faff] transition cursor-pointer"
                    >
                      <td className="py-4 px-6 font-bold text-[#3568ed]">
                        {quote.id}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#17213a]">{quote.customerName}</span>
                          <Badge
                            variant={
                              quote.customerTier === 'Gold'
                                ? 'gold'
                                : quote.customerTier === 'Silver'
                                ? 'silver'
                                : 'bronze'
                            }
                            size="sm"
                          >
                            {quote.customerTier}
                          </Badge>
                        </div>
                        {quote.dealTitle && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Deal: {quote.dealTitle}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-gray-500">
                        {formatDate(quote.createdAt)}
                      </td>
                      <td className="py-4 font-bold text-[#17213a]">
                        {formatINR(quote.netTotal)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`font-semibold ${
                            quote.grossMarginPercent >= 30
                              ? 'text-emerald-600'
                              : quote.grossMarginPercent >= 20
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatPercent(quote.grossMarginPercent)}
                        </span>
                      </td>
                      <td className="py-4">
                        <Badge variant={statusVariantMap[quote.status]} size="sm">
                          {statusLabelMap[quote.status]}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quotations/${quote.id}`);
                          }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-[#3568ed] transition"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
