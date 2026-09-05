import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCustomerOrder } from '../hooks';
import {
  StatusBadge,
  CustomerLoadingState,
  CustomerErrorState,
  OrderTimeline,
} from '../components';
import {
  ArrowLeft,
  Truck,
  Building2,
  Calendar,
  CreditCard,
} from 'lucide-react';

export const CustomerOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useCustomerOrder(id || '');

  if (isLoading) {
    return <CustomerLoadingState message="Loading order fulfillment details..." />;
  }

  if (isError || !order) {
    return (
      <CustomerErrorState
        title="Order Not Found"
        message="The requested order record could not be found."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/customer/orders"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#59657d] shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
                Order {order.orderNumber}
              </h1>
              <StatusBadge status={order.fulfillmentStatus} size="lg" />
              <StatusBadge status={order.paymentStatus} size="md" />
            </div>
            <p className="text-xs text-[#8491aa] mt-0.5">
              Converted from Quotation{' '}
              <Link
                to={`/customer/quotations/${order.quotationId}`}
                className="font-bold text-[#3568ed] hover:underline"
              >
                {order.quotationNumber}
              </Link>{' '}
              on {new Date(order.orderDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Shipment & Warehouse Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8491aa] uppercase tracking-wider">
            <Truck className="h-4 w-4 text-[#3568ed]" />
            <span>Carrier / Logistics</span>
          </div>
          <p className="mt-2 text-sm font-bold text-[#17213a]">
            {order.carrier || 'Logistics Scheduled'}
          </p>
          {order.trackingNumber && (
            <p className="mt-0.5 text-xs text-[#3568ed] font-mono">
              AWB: {order.trackingNumber}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8491aa] uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span>Estimated Delivery</span>
          </div>
          <p className="mt-2 text-sm font-bold text-[#17213a]">
            {order.estimatedDeliveryDate
              ? new Date(order.estimatedDeliveryDate).toLocaleDateString()
              : 'Within 5-7 Business Days'}
          </p>
          <p className="mt-0.5 text-xs text-emerald-600 font-medium">Standard Ground Dispatch</p>
        </div>

        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8491aa] uppercase tracking-wider">
            <Building2 className="h-4 w-4 text-purple-600" />
            <span>Fulfillment Hub</span>
          </div>
          <p className="mt-2 text-sm font-bold text-[#17213a]">
            {order.warehouseName || 'Central Distribution Center'}
          </p>
          <p className="mt-0.5 text-xs text-[#8491aa]">Allocated Inventory</p>
        </div>

        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8491aa] uppercase tracking-wider">
            <CreditCard className="h-4 w-4 text-amber-600" />
            <span>Order Value</span>
          </div>
          <p className="mt-2 text-sm font-extrabold text-[#17213a]">
            ₹ {parseFloat(order.totalAmount).toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-[#8491aa]">Inclusive of GST</p>
        </div>
      </div>

      {/* Main Grid: Line Items & Fulfillment Timeline */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Ordered Items */}
        <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#17213a]">Ordered Products & Assets</h2>
            <p className="text-xs text-[#8491aa]">Fulfillment items committed for dispatch</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e7ebf7] bg-[#f8faff] text-[#647592]">
                <tr>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Product / SKU</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">Qty</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Net Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {order.items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#fcfdff]">
                    <td className="py-4 px-4">
                      <p className="font-bold text-[#17213a]">{item.productName}</p>
                      <p className="mt-0.5 text-[11px] text-[#8491aa]">SKU: {item.sku}</p>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-[#17213a]">{item.quantity}</td>
                    <td className="py-4 px-4 text-right font-extrabold text-[#17213a]">
                      ₹ {parseFloat(item.netAmount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
            <span className="text-[#647592]">Total Order Amount:</span>
            <span className="text-base font-extrabold text-[#3568ed]">
              ₹ {parseFloat(order.totalAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Fulfillment Timeline */}
        <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
          <div className="mb-5">
            <h2 className="text-base font-bold text-[#17213a]">Fulfillment & Dispatch Progress</h2>
            <p className="text-xs text-[#8491aa]">Live tracking through 5-stage logistics pipeline</p>
          </div>

          <OrderTimeline
            timeline={order.timeline || []}
            currentStatus={order.fulfillmentStatus}
          />
        </div>
      </div>
    </div>
  );
};
