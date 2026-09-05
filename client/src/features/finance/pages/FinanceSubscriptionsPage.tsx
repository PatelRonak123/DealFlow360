import React from 'react';
import {
  Repeat,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
      <div className="grid gap-6 md:grid-cols-3">
        {isLoading ? (
          <div className="col-span-3 flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : isError ? (
          <div className="col-span-3 text-center py-8 text-xs text-red-500">
            Failed to load subscription plans.
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-xs text-gray-400">
            No active subscription plans configured.
          </div>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className="border border-purple-100/80 hover:shadow-md transition">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">
                    {plan.code}
                  </span>
                  <Badge variant={plan.isActive ? 'approved' : 'rejected'} size="sm">
                    {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-[#17213a] mt-2">
                  {plan.name}
                </CardTitle>
                <p className="text-xs text-gray-500">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="border-t border-b border-gray-100 py-3">
                  <span className="text-2xl font-bold text-[#17213a]">
                    {formatINR(parseFloat(plan.price))}
                  </span>
                  <span className="text-xs text-gray-400 font-medium"> / {plan.billingInterval.toLowerCase()}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-gray-600 text-[11px] uppercase">Included Features:</p>
                  {Array.isArray(plan.features) && plan.features.length > 0 ? (
                    plan.features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">Standard enterprise feature set</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
