import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Layers,
  Repeat,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApprovedQuotations, useGenerateInvoiceMutation } from '../hooks/useFinance';
import { formatINR, formatDate } from '@/utils/formatters';

export const FinanceBillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: approvedQuotes, isLoading, refetch } = useApprovedQuotations({ invoiced: false });
  const generateMutation = useGenerateInvoiceMutation();
  const [generatingQuoteId, setGeneratingQuoteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const approvedQuotesList = approvedQuotes || [];

  const handleGenerateInvoice = async (quoteId: string, quoteNumber: string) => {
    setGeneratingQuoteId(quoteId);
    setMessage(null);
    try {
      const created = await generateMutation.mutateAsync(quoteId);
      setMessage(`Tax Invoice ${created.invoiceNumber} generated successfully for ${quoteNumber}!`);
      setTimeout(() => {
        navigate(`/finance/invoices/${created.id}`);
      }, 1000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.message || 'Failed to generate invoice.');
      setGeneratingQuoteId(null);
    }
  };

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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => navigate('/finance/invoices')}
          >
            Manage Invoices
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Approved Quotations Awaiting Invoicing Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Approved Quotations Ready for Invoicing</CardTitle>
              {approvedQuotesList.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {approvedQuotesList.length} Ready
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Approved commercial deals ready for immediate conversion into statutory GST tax invoices.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading approved quotes...</div>
          ) : approvedQuotesList.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No approved quotations currently awaiting invoice generation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="py-2.5 px-6 font-semibold">Quotation #</th>
                    <th className="py-2.5 font-semibold">Customer</th>
                    <th className="py-2.5 font-semibold">Approved Date</th>
                    <th className="py-2.5 font-semibold">Net Deal Total</th>
                    <th className="py-2.5 px-6 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {approvedQuotesList.map((quote: any) => (
                    <tr key={quote.id} className="hover:bg-[#f8faff] transition">
                      <td className="py-3 px-6 font-bold text-[#3568ed]">
                        {quote.quotationNumber}
                      </td>
                      <td className="py-3 font-semibold text-[#17213a]">
                        {quote.customer?.companyName || 'Customer'}
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDate(quote.createdAt)}
                      </td>
                      <td className="py-3 font-bold text-emerald-700">
                        {formatINR(parseFloat(quote.totalAmount))}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3 text-[11px]"
                          disabled={generatingQuoteId === quote.id}
                          onClick={() => handleGenerateInvoice(quote.id, quote.quotationNumber)}
                        >
                          <Receipt className="h-3 w-3 mr-1" />
                          {generatingQuoteId === quote.id ? 'Generating...' : 'Generate Invoice Bill'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
