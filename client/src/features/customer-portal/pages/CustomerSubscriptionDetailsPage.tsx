import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubscription } from '../hooks';
import { StatusBadge, CustomerLoadingState, CustomerErrorState } from '../components';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const CustomerSubscriptionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: subscription, isLoading, isError, refetch } = useSubscription(id || '');

  if (isLoading) {
    return <CustomerLoadingState message="Loading subscription contract details..." />;
  }

  if (isError || !subscription) {
    return (
      <CustomerErrorState
        title="Subscription Not Found"
        message="The requested subscription agreement could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/customer/subscriptions"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#59657d] shadow-sm hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              {subscription.planName}
            </h1>
            <StatusBadge status={subscription.status} size="lg" />
          </div>
          <p className="text-xs text-[#8491aa] mt-0.5 font-mono">
            Agreement #{subscription.subscriptionNumber}
          </p>
        </div>
      </div>

      {/* Contract Summary Card */}
      <div className="rounded-3xl border border-[#e7ebf7] bg-white p-8 shadow-[0_4px_24px_rgba(64,86,145,0.06)] space-y-8">
        <div className="grid gap-6 sm:grid-cols-3 border-b border-[#f0f3fa] pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8491aa]">
              Recurring Rate
            </span>
            <p className="mt-1 text-2xl font-extrabold text-[#3568ed]">
              ₹ {parseFloat(subscription.recurringAmount).toLocaleString()}
            </p>
            <p className="text-xs text-[#647592]">{subscription.billingFrequency} Billing</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8491aa]">
              Agreement Start Date
            </span>
            <p className="mt-1 text-base font-bold text-[#17213a]">
              {new Date(subscription.startDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-[#647592]">Contract Active</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8491aa]">
              Next Renewal
            </span>
            <p className="mt-1 text-base font-bold text-[#17213a]">
              {new Date(subscription.renewalDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-emerald-600 font-semibold">Auto-Renewal Active</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#17213a] mb-4">Contract SLA Deliverables</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {subscription.features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-[#f8faff] p-4 text-xs"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="font-semibold text-[#17213a]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
