import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomerOrders } from '../hooks';
import { StatusBadge, CustomerLoadingState, CustomerEmptyState, CustomerErrorState } from '../components';
import { Boxes, Truck } from 'lucide-react';

export const CustomerOrdersPage: React.FC = () => {
  const { data: orders, isLoading, isError, refetch } = useCustomerOrders();

  if (isLoading) {
    return <CustomerLoadingState message="Loading your orders..." />;
  }

  if (isError) {
    return <CustomerErrorState onRetry={() => refetch()} />;
  }

  if (!orders || orders.length === 0) {
    return (
      <CustomerEmptyState
        title="No Orders Found"
        description="You have not confirmed any quotations into active sales orders yet."
        icon={Boxes}
        actionText="View Quotations"
        actionHref="/customer/quotations"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">My Orders</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Track warehouse processing, carrier dispatch, and fulfillment delivery milestones.
        </p>
      </div>

      {/* Orders Table */}
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
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#3568ed] shadow-sm transition hover:bg-[#edf4ff] hover:border-[#3568ed]/40"
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
      </div>
    </div>
  );
};
