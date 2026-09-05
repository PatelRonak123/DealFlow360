import React from 'react';
import { Link } from 'react-router-dom';
import { useSubscriptions } from '../hooks';
import { StatusBadge, CustomerLoadingState, CustomerEmptyState, CustomerErrorState } from '../components';
import { Repeat, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export const CustomerSubscriptionsPage: React.FC = () => {
  const { data: subscriptions, isLoading, isError, refetch } = useSubscriptions();

  if (isLoading) {
    return <CustomerLoadingState message="Loading recurring subscriptions..." />;
  }

  if (isError) {
    return <CustomerErrorState onRetry={() => refetch()} />;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <CustomerEmptyState
        title="No Active Subscriptions"
        description="Your account currently does not have active recurring SLA or SaaS support contracts."
        icon={Repeat}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">Subscriptions & SLAs</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Manage recurring enterprise contracts, SLA guarantees, and auto-renewal cycles.
        </p>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subscriptions.map((sub) => (
          <div
            key={sub.id}
            className="flex flex-col justify-between rounded-3xl border border-[#e7ebf7] bg-white p-6 shadow-[0_4px_20px_rgba(64,86,145,0.05)] transition hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#3568ed]">
                  <Repeat className="h-5 w-5" />
                </span>
                <StatusBadge status={sub.status} />
              </div>

              <h3 className="mt-4 text-base font-bold text-[#17213a]">{sub.planName}</h3>
              <p className="text-xs text-[#8491aa] font-mono mt-0.5">{sub.subscriptionNumber}</p>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-[#f8faff] p-4">
                <p className="text-xs text-[#647592]">Recurring Fee</p>
                <p className="mt-1 text-2xl font-extrabold text-[#3568ed]">
                  ₹ {parseFloat(sub.recurringAmount).toLocaleString()}
                  <span className="text-xs font-normal text-[#647592]"> / {sub.billingFrequency.toLowerCase()}</span>
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8491aa]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Renews on {new Date(sub.renewalDate).toLocaleDateString()}</span>
                </div>
              </div>

              {sub.features && sub.features.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8491aa]">
                    Included SLA & Features
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#59657d]">
                    {sub.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <Link
                to={`/customer/subscriptions/${sub.id}`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-[#3568ed] shadow-sm hover:bg-[#edf4ff] hover:border-[#3568ed]/40 transition"
              >
                <span>View Contract Terms</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
