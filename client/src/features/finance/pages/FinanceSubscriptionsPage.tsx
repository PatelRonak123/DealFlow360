import React from 'react';
import {
  Repeat,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdminSubscriptionPlans } from '@/features/admin/hooks/useAdmin';
import { formatINR } from '@/utils/formatters';

export const FinanceSubscriptionsPage: React.FC = () => {
  const { data: plans = [], isLoading, isError, refetch } = useAdminSubscriptionPlans();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            <Repeat className="h-3.5 w-3.5" />
            Recurring Revenue Contracts
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17213a]">
            Subscription Plans &amp; Recurring Revenue
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Monitor active SaaS subscription tiers, recurring billing cycles, and Annual Recurring Revenue (ARR).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh Plans
        </Button>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : isError ? (
          <div className="col-span-full text-center py-8 text-xs text-red-500">
            Failed to load subscription plans.
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full text-center py-12 text-xs text-gray-400">
            No active subscription plans configured.
          </div>
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              hoverable
              className="flex flex-col justify-between border border-purple-100/80 bg-white p-6 transition-all duration-200"
            >
              <div>
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2 pb-3">
                  <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/80 tracking-tight">
                    {plan.code}
                  </span>
                  <Badge variant={plan.isActive ? 'approved' : 'rejected'} size="sm">
                    {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>

                {/* Plan Title & Description */}
                <div className="mt-1">
                  <h3 className="text-base font-bold text-[#17213a] tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#59657d] leading-relaxed line-clamp-3">
                    {plan.description || 'Enterprise software license subscription package with automated routing.'}
                  </p>
                </div>

                {/* Pricing Block */}
                <div className="my-4 rounded-xl bg-slate-50/80 border border-slate-100 p-3.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[#17213a]">
                    {formatINR(parseFloat(plan.price))}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    / {plan.billingInterval.toLowerCase()}
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">
                    Included Features:
                  </p>
                  {Array.isArray(plan.features) && plan.features.length > 0 ? (
                    <div className="space-y-2">
                      {plan.features.map((feat: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-tight font-medium text-xs text-[#2b354f]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-xs">Standard enterprise feature set</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
