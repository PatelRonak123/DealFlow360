import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Kanban as KanbanIcon,
  List,
  PlusCircle,
  FileText,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useDeals } from '@/features/deals/store/dealStore';
import { DealStage } from '@/features/deals/types/Deal';
import { formatINR, formatCompactINR } from '@/utils/formatters';

const STAGES: { id: DealStage; label: string; description: string; color: string }[] = [
  { id: 'discovery', label: 'Discovery', description: 'Requirements scoping', color: 'border-t-slate-400' },
  { id: 'proposal', label: 'Proposal / Quote', description: 'CPQ quote generated', color: 'border-t-[#3568ed]' },
  { id: 'negotiation', label: 'Negotiation', description: 'Terms & counter-offers', color: 'border-t-purple-500' },
  { id: 'closed_won', label: 'Closed Won', description: 'Signed contract / Won', color: 'border-t-emerald-500' },
];

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { deals, updateDealStage } = useDeals();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterHealth, setFilterHealth] = useState<string>('all');

  const filteredDeals = deals.filter((deal) => {
    if (filterHealth === 'all') return true;
    if (filterHealth === 'risky') return deal.health !== 'healthy';
    return deal.health === filterHealth;
  });

  const totalValue = filteredDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            My Deals & Pipeline
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Manage your opportunities, track deal health, and generate governed CPQ quotations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-[#e4e9f7] bg-[#f8faff] p-1">
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
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#3568ed] shadow-xs'
                  : 'text-[#59657d] hover:text-[#17213a]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
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

      {/* Filter Bar & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#71809f] mr-2">
            Filter Health:
          </span>
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'risky', label: 'Needs Attention (Risky)' },
            { id: 'stalled', label: 'Stalled Deals' },
            { id: 'discount_anomaly', label: 'Discount Anomalies' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterHealth(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                filterHealth === tab.id
                  ? 'bg-[#3568ed] text-white font-semibold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#59657d]">
            <span>Active Deals:</span>
            <strong className="text-[#17213a]">{filteredDeals.length}</strong>
          </div>
          <div className="flex items-center gap-1.5 text-[#59657d]">
            <span>Total Value:</span>
            <strong className="text-[#3568ed]">{formatINR(totalValue)}</strong>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((col) => {
            const colDeals = filteredDeals.filter((d) => d.stage === col.id);
            const colTotal = colDeals.reduce((sum, d) => sum + d.amount, 0);

            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl border border-[#e7ebf7] bg-[#fbfcfe] p-4 min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="mb-3 border-b border-[#eef2f9] pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#17213a]">{col.label}</span>
                    <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-600">
                      {colDeals.length}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#71809f]">
                    <span>{col.description}</span>
                    <span className="font-bold text-[#3568ed]">{formatCompactINR(colTotal)}</span>
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="flex-1 space-y-3">
                  {colDeals.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-4 text-center">
                      <p className="text-xs text-gray-400">No deals in this stage</p>
                    </div>
                  ) : (
                    colDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className={`rounded-xl border border-[#e4eaf6] bg-white p-4 shadow-[0_4px_12px_rgba(64,86,145,0.04)] hover:border-[#b8cbf5] hover:shadow-md transition-all ${col.color} border-t-4`}
                      >
                        {/* Header: Customer & Tier */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <h4 className="text-xs font-bold text-[#17213a] truncate">
                              {deal.customerName}
                            </h4>
                          </div>
                          <Badge
                            variant={
                              deal.customerTier === 'Gold'
                                ? 'gold'
                                : deal.customerTier === 'Silver'
                                ? 'silver'
                                : 'bronze'
                            }
                            size="sm"
                          >
                            {deal.customerTier}
                          </Badge>
                        </div>

                        {/* Title */}
                        <p className="mt-2 text-xs font-medium text-[#475467] line-clamp-2">
                          {deal.title}
                        </p>

                        {/* Amount & Probability */}
                        <div className="mt-3 flex items-center justify-between border-t border-[#f2f5fb] pt-2.5">
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase">Expected Value</span>
                            <span className="text-sm font-bold text-[#17213a]">
                              {formatINR(deal.amount)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block uppercase">Win Rate</span>
                            <span className="text-xs font-bold text-emerald-600">
                              {deal.winProbability}%
                            </span>
                          </div>
                        </div>

                        {/* Deal Health Callout if not healthy */}
                        {deal.health !== 'healthy' && (
                          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200/80 p-2 text-[11px] text-amber-800">
                            <div className="flex items-center gap-1 font-semibold">
                              <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                              <span className="capitalize">{deal.health.replace('_', ' ')}</span>
                            </div>
                            {deal.healthReason && (
                              <p className="mt-0.5 text-[10px] text-amber-700 leading-tight">
                                {deal.healthReason}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="mt-3 flex items-center gap-2 border-t border-[#f2f5fb] pt-2.5">
                          {deal.quoteId ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full text-xs"
                              leftIcon={<FileText className="h-3.5 w-3.5" />}
                              onClick={() => navigate(`/quotations/${deal.quoteId}`)}
                            >
                              View Quote {deal.quoteId}
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full text-xs"
                              leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
                              onClick={() => navigate(`/quotations/new?dealId=${deal.id}&customerId=${deal.customerId}`)}
                            >
                              Generate Quote
                            </Button>
                          )}
                        </div>

                        {/* Move stage quick dropdown for demoing */}
                        <div className="mt-2 text-right">
                          <select
                            value={deal.stage}
                            onChange={(e) => updateDealStage(deal.id, e.target.value as DealStage)}
                            className="text-[10px] text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer focus:outline-none"
                            title="Move stage for demo"
                          >
                            <option value="discovery">Stage: Discovery</option>
                            <option value="proposal">Stage: Proposal</option>
                            <option value="negotiation">Stage: Negotiation</option>
                            <option value="closed_won">Stage: Closed Won</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eef2f9] text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                  <th className="pb-3 font-semibold">Deal Title</th>
                  <th className="pb-3 font-semibold">Customer & Tier</th>
                  <th className="pb-3 font-semibold">Stage</th>
                  <th className="pb-3 font-semibold">Deal Value</th>
                  <th className="pb-3 font-semibold">Win Prob.</th>
                  <th className="pb-3 font-semibold">Health Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f5fb]">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-[#f8faff] transition">
                    <td className="py-3.5">
                      <p className="font-bold text-[#17213a]">{deal.title}</p>
                      <span className="text-[10px] text-gray-400">ID: {deal.id}</span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{deal.customerName}</span>
                        <Badge
                          variant={
                            deal.customerTier === 'Gold'
                              ? 'gold'
                              : deal.customerTier === 'Silver'
                              ? 'silver'
                              : 'bronze'
                          }
                          size="sm"
                        >
                          {deal.customerTier}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 capitalize">
                        {deal.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-[#17213a]">
                      {formatINR(deal.amount)}
                    </td>
                    <td className="py-3.5 font-semibold text-emerald-600">
                      {deal.winProbability}%
                    </td>
                    <td className="py-3.5">
                      <Badge
                        variant={
                          deal.health === 'healthy'
                            ? 'success'
                            : deal.health === 'stalled'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {deal.health.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right">
                      {deal.quoteId ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/quotations/${deal.quoteId}`)}
                        >
                          View Quote
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/quotations/new?dealId=${deal.id}&customerId=${deal.customerId}`)}
                        >
                          Create Quote
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
