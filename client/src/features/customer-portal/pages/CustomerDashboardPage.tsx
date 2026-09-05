import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomerDashboard } from '../hooks';
import { StatusBadge, CustomerLoadingState, CustomerErrorState } from '../components';
import {
  FileText,
  Clock3,
  Boxes,
  Receipt,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const { data: metrics, isLoading, isError, refetch } = useCustomerDashboard();

  if (isLoading) {
    return <CustomerLoadingState message="Loading your customer portal dashboard..." />;
  }

  if (isError || !metrics) {
    return (
      <CustomerErrorState
        title="Dashboard Unavailable"
        message="Could not load your commercial portal data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const statCards = [
    {
      label: 'Active Quotations',
      value: metrics.activeQuotations,
      icon: FileText,
      color: 'blue',
      href: '/customer/quotations',
      description: 'Pending and approved proposals',
    },
    {
      label: 'Pending Negotiations',
      value: metrics.pendingNegotiations,
      icon: Clock3,
      color: 'amber',
      href: '/customer/quotations?status=NEGOTIATION',
      description: 'Discount counters under review',
    },
    {
      label: 'Confirmed Orders',
      value: metrics.confirmedOrders,
      icon: Boxes,
      color: 'emerald',
      href: '/customer/orders',
      description: 'Active fulfillment & dispatch',
    },
    {
      label: 'Outstanding Invoices',
      value: metrics.outstandingInvoices,
      icon: Receipt,
      color: 'purple',
      href: '/customer/invoices',
      description: 'Pending commercial settlements',
    },
  ];

  const colorStyles: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: 'bg-[#edf4ff]', text: 'text-[#3568ed]', ring: 'hover:border-[#3568ed]/40' },
    amber: { bg: 'bg-[#fff8eb]', text: 'text-[#d97706]', ring: 'hover:border-amber-400/40' },
    emerald: { bg: 'bg-[#eaf9f1]', text: 'text-[#16a34a]', ring: 'hover:border-emerald-400/40' },
    purple: { bg: 'bg-[#f5f0ff]', text: 'text-[#9333ea]', ring: 'hover:border-purple-400/40' },
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center rounded-3xl border border-[#e7ebf7] bg-white p-8 shadow-[0_8px_30px_rgba(64,86,145,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8491aa]">
              Customer Self-Service Portal
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#17213a]">
            Customer Portal Overview
          </h1>
          <p className="mt-1 text-sm text-[#647592]">
            Review quotations, negotiate volume discounts, track shipments, and settle invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/customer/quotations"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#3568ed]/20 transition hover:bg-[#274fc1]"
          >
            <span>Review Quotations</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const style = colorStyles[card.color];

          return (
            <Link
              key={card.label}
              to={card.href}
              className={`group relative rounded-2xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)] transition hover:shadow-lg ${style.ring}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.bg} ${style.text} shadow-inner`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-3xl font-extrabold text-[#17213a]">{card.value}</span>
              </div>
              <h3 className="mt-4 text-sm font-bold text-[#17213a]">{card.label}</h3>
              <p className="mt-1 text-xs text-[#8491aa]">{card.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Recent Quotations & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Quotations */}
        <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17213a]">Recent Quotations</h2>
              <p className="text-xs text-[#8491aa]">Active commercial proposals and pricing offers</p>
            </div>
            <Link
              to="/customer/quotations"
              className="text-xs font-bold text-[#3568ed] hover:underline inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#f0f3fa]">
            {metrics.recentQuotations.length > 0 ? (
              metrics.recentQuotations.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between py-3.5 transition hover:bg-[#fcfdff] -mx-2 px-2 rounded-xl"
                >
                  <div>
                    <Link
                      to={`/customer/quotations/${quote.id}`}
                      className="text-sm font-bold text-[#3568ed] hover:underline"
                    >
                      {quote.quotationNumber}
                    </Link>
                    <p className="text-xs text-[#8491aa] mt-0.5">
                      Valid until: {new Date(quote.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-[#17213a]">
                        ₹ {parseFloat(quote.totalAmount).toLocaleString()}
                      </p>
                      <div className="mt-0.5">
                        <StatusBadge status={quote.status} size="sm" />
                      </div>
                    </div>
                    <Link
                      to={`/customer/quotations/${quote.id}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#3568ed]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs font-medium text-[#8491aa]">
                No quotations found yet. Proposals generated by your Sales Representative will appear here.
              </p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17213a]">Recent Orders</h2>
              <p className="text-xs text-[#8491aa]">Confirmed orders in processing and dispatch</p>
            </div>
            <Link
              to="/customer/orders"
              className="text-xs font-bold text-[#3568ed] hover:underline inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#f0f3fa]">
            {metrics.recentOrders.length > 0 ? (
              metrics.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3.5 transition hover:bg-[#fcfdff] -mx-2 px-2 rounded-xl"
                >
                  <div>
                    <Link
                      to={`/customer/orders/${order.id}`}
                      className="text-sm font-bold text-[#17213a] hover:text-[#3568ed]"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-[#8491aa] mt-0.5">
                      From {order.quotationNumber} • {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-[#17213a]">
                        ₹ {parseFloat(order.totalAmount).toLocaleString()}
                      </p>
                      <div className="mt-0.5">
                        <StatusBadge status={order.fulfillmentStatus} size="sm" />
                      </div>
                    </div>
                    <Link
                      to={`/customer/orders/${order.id}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#3568ed]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs font-medium text-[#8491aa]">
                No active orders found. Confirm an approved quotation to create an order.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#17213a]">Recent Activity</h2>
          <p className="text-xs text-[#8491aa]">Real-time operational audit and notification stream</p>
        </div>

        {metrics.recentActivity.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.recentActivity.map((act) => (
              <div
                key={act.id}
                className="rounded-2xl border border-[#f0f3fa] bg-[#fcfdff] p-4 text-xs space-y-1 transition hover:border-[#3568ed]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17213a]">{act.title}</span>
                  <span className="text-[10px] text-[#8491aa]">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[#647592]">{act.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs font-medium text-[#8491aa]">
            No recent activity or notifications recorded yet.
          </p>
        )}
      </div>
    </div>
  );
};
