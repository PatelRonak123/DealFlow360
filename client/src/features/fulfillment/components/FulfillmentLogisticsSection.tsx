import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Warehouse,
  Boxes,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  useFulfillmentsList,
  useWarehousesList,
  useInventoryList,
  useFulfillMutation,
  useCancelFulfillmentMutation,
} from '../hooks/useFulfillment';
import { BackendFulfillmentItem, FulfillmentStatus } from '../api/fulfillmentApi';
import { formatDate } from '@/utils/formatters';

interface FulfillmentLogisticsSectionProps {
  isStandalone?: boolean;
}

export const FulfillmentLogisticsSection: React.FC<FulfillmentLogisticsSectionProps> = ({
  isStandalone = false,
}) => {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFulfill, setSelectedFulfill] = useState<BackendFulfillmentItem | null>(null);
  const [selectedCancel, setSelectedCancel] = useState<BackendFulfillmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  const {
    data: fulfillmentData,
    isLoading,
    isFetching,
    refetch,
  } = useFulfillmentsList({
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    limit: 50,
  });

  const { data: warehouses = [] } = useWarehousesList();
  const { data: inventory = [] } = useInventoryList();

  const fulfillMutation = useFulfillMutation();
  const cancelMutation = useCancelFulfillmentMutation();

  const items = fulfillmentData?.items || [];

  // Filter items by client-side search query
  const filteredItems = items.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.fulfillmentNumber.toLowerCase().includes(q) ||
      f.quotationNumber.toLowerCase().includes(q) ||
      f.customerName.toLowerCase().includes(q)
    );
  });

  // Calculate high-level summary KPIs
  const totalAllocated = items.filter(
    (i) => i.status === 'ALLOCATED' || i.status === 'PARTIALLY_ALLOCATED'
  ).length;
  const totalFulfilled = items.filter((i) => i.status === 'FULFILLED').length;
  const totalInventoryUnits = inventory.reduce((sum, inv) => sum + (inv.quantityOnHand || 0), 0);

  const getStatusBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case 'FULFILLED':
        return <Badge variant="approved" size="sm">Fulfilled &amp; Dispatched</Badge>;
      case 'ALLOCATED':
        return <Badge variant="pending" size="sm">Stock Allocated</Badge>;
      case 'PARTIALLY_ALLOCATED':
        return <Badge variant="pending" size="sm">Partially Allocated</Badge>;
      case 'CANCELLED':
        return <Badge variant="rejected" size="sm">Cancelled</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="draft" size="sm">Allocation Pending</Badge>;
    }
  };

  const handleConfirmFulfill = async () => {
    if (!selectedFulfill) return;
    try {
      await fulfillMutation.mutateAsync({
        id: selectedFulfill.id,
        notes: dispatchNotes || undefined,
      });
      setSelectedFulfill(null);
      setDispatchNotes('');
    } catch {
      // Error handled by hook toast
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancel) return;
    if (!cancelReason.trim()) return;
    try {
      await cancelMutation.mutateAsync({
        id: selectedCancel.id,
        reason: cancelReason,
      });
      setSelectedCancel(null);
      setCancelReason('');
    } catch {
      // Error handled by hook toast
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#3568ed]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Active Fulfillments
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-[#3568ed]">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{items.length}</p>
            <p className="mt-0.5 text-xs text-gray-400">Total logged orders</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Allocated / Pending Dispatch
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{totalAllocated}</p>
            <p className="mt-0.5 text-xs text-amber-600 font-medium">Ready for dispatch carrier</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Completed &amp; Dispatched
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{totalFulfilled}</p>
            <p className="mt-0.5 text-xs text-emerald-600 font-medium">Delivered / In Transit</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Warehouse Facilities
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <Warehouse className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#17213a]">{warehouses.length} Nodes</p>
            <p className="mt-0.5 text-xs text-purple-600 font-medium">
              {totalInventoryUnits.toLocaleString()} units logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warehouses Facilities Strip */}
      <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-[#3568ed]" />
            <h3 className="text-sm font-bold text-[#17213a]">
              Active Regional Logistics &amp; Warehouses
            </h3>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {warehouses.length} Operational Facilities
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {warehouses.slice(0, 4).map((wh) => (
            <div
              key={wh.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#fbfcfe] p-3 hover:border-blue-200 transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
                <Boxes className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#17213a]">{wh.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="font-mono">{wh.code}</span>
                  <span>•</span>
                  <span>{wh.city || 'India'}</span>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500" title="Operational" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 w-64 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order, quote, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 ml-2">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'ALLOCATED', label: 'Allocated' },
              { id: 'PARTIALLY_ALLOCATED', label: 'Partially Allocated' },
              { id: 'FULFILLED', label: 'Fulfilled' },
              { id: 'CANCELLED', label: 'Cancelled' },
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
              onClick={() => navigate('/fulfillment')}
              leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Full Console
            </Button>
          )}
        </div>
      </div>

      {/* Main Fulfillments Table */}
      <Card>
        <CardContent className="p-0 relative">
          {isFetching && items.length > 0 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 overflow-hidden z-10">
              <div className="h-full bg-[#3568ed] animate-pulse w-full" />
            </div>
          )}

          {isLoading && items.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
              Loading fulfillment and logistics pipeline...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="mx-auto h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-[#17213a]">No fulfillment orders found</p>
              <p className="mt-1 text-xs text-gray-400">
                Approved quotations with confirmed delivery schedules will appear here for logistics dispatch.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="py-3 px-6 font-semibold">Fulfillment ID</th>
                    <th className="py-3 font-semibold">Quotation Ref</th>
                    <th className="py-3 font-semibold">Customer</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 font-semibold">Allocated Date</th>
                    <th className="py-3 font-semibold">Dispatch Milestone</th>
                    <th className="py-3 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {filteredItems.map((f) => {
                    const isAllocated =
                      f.status === 'ALLOCATED' || f.status === 'PARTIALLY_ALLOCATED';
                    return (
                      <tr key={f.id} className="hover:bg-[#f8faff] transition">
                        <td className="py-3.5 px-6 font-bold text-[#3568ed] font-mono">
                          {f.fulfillmentNumber}
                        </td>
                        <td className="py-3.5 font-semibold text-[#17213a]">
                          <button
                            type="button"
                            onClick={() => navigate(`/quotations/${f.quotationId}`)}
                            className="hover:underline hover:text-[#3568ed] transition text-left"
                          >
                            {f.quotationNumber}
                          </button>
                        </td>
                        <td className="py-3.5 text-gray-800 font-medium">
                          {f.customerName || 'Enterprise Account'}
                        </td>
                        <td className="py-3.5">{getStatusBadge(f.status)}</td>
                        <td className="py-3.5 text-gray-500">
                          {f.allocatedAt ? formatDate(f.allocatedAt) : '—'}
                        </td>
                        <td className="py-3.5 text-gray-500">
                          {f.fulfilledAt ? (
                            <span className="text-emerald-600 font-semibold">
                              {formatDate(f.fulfilledAt)}
                            </span>
                          ) : f.cancelledAt ? (
                            <span className="text-rose-600">Cancelled ({formatDate(f.cancelledAt)})</span>
                          ) : (
                            <span className="text-amber-600 font-medium">Pending Carrier Pick</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAllocated && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="h-7 px-2.5 text-[11px]"
                                  onClick={() => {
                                    setSelectedFulfill(f);
                                    setDispatchNotes('');
                                  }}
                                >
                                  Mark Dispatched
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50"
                                  onClick={() => {
                                    setSelectedCancel(f);
                                    setCancelReason('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {f.status === 'FULFILLED' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched
                              </span>
                            )}
                            {f.status === 'CANCELLED' && (
                              <span className="text-[11px] text-gray-400">Closed</span>
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

      {/* Modal: Confirm Fulfillment Dispatch */}
      <Modal
        isOpen={Boolean(selectedFulfill)}
        onClose={() => setSelectedFulfill(null)}
        title="Confirm Carrier Dispatch"
        description="Verify inventory release and courier assignment."
      >
        {selectedFulfill && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Fulfillment ID:</span>
                  <p className="font-bold text-[#17213a]">{selectedFulfill.fulfillmentNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Quotation #:</span>
                  <p className="font-bold text-[#17213a]">{selectedFulfill.quotationNumber}</p>
                </div>
                <div className="col-span-2 mt-1">
                  <span className="text-gray-500">Customer:</span>
                  <p className="font-semibold text-[#17213a]">{selectedFulfill.customerName}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Carrier Manifest Notes / Waybill #
              </label>
              <textarea
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                placeholder="e.g. Dispatched via Bluedart Air Cargo AWB-84920491. 4 server chassis verified."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none focus:ring-2 focus:ring-[#3568ed]/15"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedFulfill(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={fulfillMutation.isPending}
                onClick={handleConfirmFulfill}
              >
                Confirm Dispatch
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Cancel Fulfillment */}
      <Modal
        isOpen={Boolean(selectedCancel)}
        onClose={() => setSelectedCancel(null)}
        title="Cancel Fulfillment Order"
        description="Releases reserved warehouse inventory back to available stock."
      >
        {selectedCancel && (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-xs text-rose-800">
              <p className="font-semibold">Cancelling {selectedCancel.fulfillmentNumber}</p>
              <p className="mt-1 text-rose-600">
                All allocated products will be unreserved and returned to their respective regional warehouses.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cancellation Reason (Required)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer delivery schedule deferred"
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
                disabled={!cancelReason.trim()}
                isLoading={cancelMutation.isPending}
                onClick={handleConfirmCancel}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
