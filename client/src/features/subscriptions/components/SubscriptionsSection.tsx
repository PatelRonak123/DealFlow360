import React, { useState } from 'react';
import {
  Repeat,
  ShieldCheck,
  Calendar,
  RefreshCw,
  Search,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  useSubscriptionsList,
  useRenewSubscriptionMutation,
  useCancelSubscriptionMutation,
} from '../hooks/useSubscriptions';
import { SubscriptionItem } from '../api/subscriptionsApi';
import { formatINR, formatDate } from '@/utils/formatters';

interface SubscriptionsSectionProps {
  isStandalone?: boolean;
}

export const SubscriptionsSection: React.FC<SubscriptionsSectionProps> = ({
  isStandalone = false,
}) => {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRenew, setSelectedRenew] = useState<SubscriptionItem | null>(null);
  const [selectedCancel, setSelectedCancel] = useState<SubscriptionItem | null>(null);
  const [renewalNotes, setRenewalNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const {
    data: subData,
    isLoading,
    isFetching,
    refetch,
  } = useSubscriptionsList({
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    search: searchQuery.trim() || undefined,
    limit: 50,
  });

  const renewMutation = useRenewSubscriptionMutation();
  const cancelMutation = useCancelSubscriptionMutation();

  const items = subData?.items || [];
  const summary = subData?.summary || {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalArr: 0,
    totalMrr: 0,
    pendingRenewalsCount: 0,
    pastDueCount: 0,
    averageArr: 0,
    netRetentionRate: 0,
  };

  const getStatusBadge = (status: SubscriptionItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="approved" size="sm">Active Contract</Badge>;
      case 'PENDING_RENEWAL':
        return <Badge variant="pending" size="sm">Renewal Due (&lt;30d)</Badge>;
      case 'PAST_DUE':
        return <Badge variant="rejected" size="sm">Past Due</Badge>;
      case 'CANCELLED':
        return <Badge variant="default" size="sm">Terminated</Badge>;
    }
  };

  const handleConfirmRenew = async () => {
    if (!selectedRenew) return;
    try {
      await renewMutation.mutateAsync({
        id: selectedRenew.id,
        notes: renewalNotes || undefined,
      });
      setSelectedRenew(null);
      setRenewalNotes('');
    } catch {
      // Error handled by hook toast
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancel) return;
    try {
      await cancelMutation.mutateAsync({
        id: selectedCancel.id,
        reason: cancelReason || undefined,
      });
      setSelectedCancel(null);
      setCancelReason('');
    } catch {
      // Error handled by hook toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 4 Executive ARR / SaaS Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#3568ed]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Annual Recurring Revenue (ARR)
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-[#3568ed]">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{formatINR(summary.totalArr)}</p>
            <p className="mt-0.5 text-xs text-[#3568ed] font-medium">
              MRR: {formatINR(summary.totalMrr)} / mo
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Active Contracts
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Repeat className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{summary.activeSubscriptions}</p>
            <p className="mt-0.5 text-xs text-emerald-600 font-medium">
              Avg Contract: {formatINR(summary.averageArr)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Renewals Due (&lt;30 Days)
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{summary.pendingRenewalsCount}</p>
            <p className="mt-0.5 text-xs text-amber-600 font-medium">Require Sales Rep outreach</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Net Revenue Retention (NRR)
              </span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{summary.netRetentionRate}%</p>
            <p className="mt-0.5 text-xs text-indigo-600 font-medium">Top decile enterprise SaaS</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 w-64 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search subscriber, email, or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 ml-2">
            {[
              { id: 'all', label: 'All Subscriptions' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'PENDING_RENEWAL', label: 'Renewals Due' },
              { id: 'PAST_DUE', label: 'Past Due' },
              { id: 'CANCELLED', label: 'Terminated' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-[#3568ed] text-white font-semibold shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-[#3568ed]' : ''}`} />
            <span>{isFetching ? 'Syncing...' : 'Refresh'}</span>
          </button>
          {!isStandalone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/subscriptions')}
              leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Full Console
            </Button>
          )}
        </div>
      </div>

      {/* Main Subscriptions Table */}
      <Card>
        <CardContent className="p-0 relative">
          {isFetching && items.length > 0 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 overflow-hidden z-10">
              <div className="h-full bg-[#3568ed] animate-pulse w-full" />
            </div>
          )}

          {isLoading && items.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
              Loading recurring subscriptions &amp; renewal contracts...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Repeat className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-[#17213a]">No subscriptions found</p>
              <p className="mt-1 text-xs text-gray-400">
                Recurring SaaS and platform contracts will appear here once converted from approved quotations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="py-3 px-6 font-semibold">Subscription #</th>
                    <th className="py-3 font-semibold">Customer &amp; Tier</th>
                    <th className="py-3 font-semibold">Plan Name</th>
                    <th className="py-3 font-semibold">Contract ARR</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 font-semibold">Renewal Horizon</th>
                    <th className="py-3 font-semibold">SLA Guarantee</th>
                    <th className="py-3 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {items.map((sub) => {
                    const isUpcoming = sub.daysUntilRenewal <= 30 && sub.status !== 'CANCELLED';
                    return (
                      <tr key={sub.id} className="hover:bg-[#f8faff] transition">
                        <td className="py-3.5 px-6 font-bold text-[#3568ed] font-mono">
                          {sub.subscriptionNumber}
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-[#17213a]">{sub.customerName}</p>
                          <span className="text-[10px] text-gray-400">{sub.tierName}</span>
                        </td>
                        <td className="py-3.5 font-medium text-gray-700">
                          {sub.planName}
                          <span className="block text-[10px] text-gray-400">
                            {sub.billingFrequency} billing
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-[#17213a]">
                          {formatINR(sub.arr)}
                          <span className="block text-[10px] text-gray-400 font-normal">
                            {formatINR(sub.mrr)} /mo
                          </span>
                        </td>
                        <td className="py-3.5">{getStatusBadge(sub.status)}</td>
                        <td className="py-3.5">
                          <p className="font-semibold text-[#17213a]">{formatDate(sub.renewalDate)}</p>
                          <span
                            className={`text-[10px] font-medium ${
                              isUpcoming ? 'text-amber-600 font-bold' : 'text-gray-400'
                            }`}
                          >
                            {sub.daysUntilRenewal > 0
                              ? `in ${sub.daysUntilRenewal} days`
                              : 'renewal overdue'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                            {sub.slaTier}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {sub.status !== 'CANCELLED' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-[11px] text-[#3568ed]"
                                  onClick={() => {
                                    setSelectedRenew(sub);
                                    setRenewalNotes('');
                                  }}
                                >
                                  Renew Term
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50"
                                  onClick={() => {
                                    setSelectedCancel(sub);
                                    setCancelReason('');
                                  }}
                                >
                                  Terminate
                                </Button>
                              </>
                            )}
                            {sub.status === 'CANCELLED' && (
                              <span className="text-[11px] text-gray-400">Terminated</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Confirm Term Renewal */}
      <Modal
        isOpen={Boolean(selectedRenew)}
        onClose={() => setSelectedRenew(null)}
        title="Renew Subscription Contract"
        description="Advance term expiration and lock ARR commitment."
      >
        {selectedRenew && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs">
              <p className="font-bold text-[#17213a]">{selectedRenew.planName}</p>
              <p className="text-gray-600 mt-0.5">Subscriber: {selectedRenew.customerName}</p>
              <p className="text-[#3568ed] font-bold mt-2">
                Annual Contract Value: {formatINR(selectedRenew.arr)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Renewal Terms / Amendments Note (Optional)
              </label>
              <textarea
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
                placeholder="e.g. Standard 12-month extension with 5% indexation."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedRenew(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={renewMutation.isPending}
                onClick={handleConfirmRenew}
              >
                Confirm 1-Year Renewal
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Confirm Cancellation */}
      <Modal
        isOpen={Boolean(selectedCancel)}
        onClose={() => setSelectedCancel(null)}
        title="Terminate Subscription"
        description="Terminates recurring billing and disables auto-renewal."
      >
        {selectedCancel && (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-xs text-rose-800">
              <p className="font-semibold">Terminating {selectedCancel.subscriptionNumber}</p>
              <p className="mt-1">
                Will mark contract as CANCELLED and remove {formatINR(selectedCancel.arr)} from active ARR.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Termination Reason
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer migrated infrastructure"
                className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedCancel(null)}>
                Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={cancelMutation.isPending}
                onClick={handleConfirmCancel}
              >
                Terminate Contract
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
