import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Layers,
  Repeat,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const FinanceBillingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CalendarClock className="h-3.5 w-3.5" />
            Commercial Operations
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17213a]">
            Billing &amp; Invoicing Schedule Console
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Hybrid billing operations combining one-time hardware/services with recurring SaaS subscriptions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => navigate('/finance/invoices')}
        >
          Manage Invoices
        </Button>
      </div>

      {/* Hybrid Billing Architecture Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-emerald-100 bg-emerald-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-emerald-800 font-bold flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-600" /> One-Time Products
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p className="text-[#17213a] font-semibold">Hardware, Equipment &amp; Implementations</p>
            <p className="text-gray-600">
              Immediate commercial invoicing upon quote confirmation and order conversion.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Direct Tax Invoice Generation
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 bg-purple-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-purple-800 font-bold flex items-center gap-1.5">
              <Repeat className="h-4 w-4 text-purple-600" /> Recurring SaaS Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p className="text-[#17213a] font-semibold">Software Licenses &amp; Enterprise Support</p>
            <p className="text-gray-600">
              Automated monthly or annual recurring billing schedules with renewal tracking.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/finance/subscriptions')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
              >
                View Subscription Contracts <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-100 bg-blue-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-blue-800 font-bold flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-blue-600" /> Milestone Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p className="text-[#17213a] font-semibold">Staged Contract Dispatch Triggers</p>
            <p className="text-gray-600">
              50% advance upon contract signing + 50% upon warehouse dispatch &amp; delivery.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                <Clock className="h-3.5 w-3.5" /> Milestone Triggers Active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Workflows and Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Financial Billing Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/70 space-y-1.5">
              <p className="font-bold text-[#17213a]">Standard Payment Terms</p>
              <p className="text-gray-600">Net 30 Days from date of tax invoice issuance across standard commercial tiers.</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/70 space-y-1.5">
              <p className="font-bold text-[#17213a]">Statutory Tax &amp; GST Rates</p>
              <p className="text-gray-600">Standard 18.00% GST integrated into all subtotal and commercial calculations.</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/70 space-y-1.5">
              <p className="font-bold text-[#17213a]">Late Payment &amp; Aging Governance</p>
              <p className="text-gray-600">Invoices exceeding 30 days overdue trigger automated credit hold notifications.</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/70 space-y-1.5">
              <p className="font-bold text-[#17213a]">Discount Governance Floor</p>
              <p className="text-gray-600">Enforced 20.0% gross margin threshold on all commercial deals and quotes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
