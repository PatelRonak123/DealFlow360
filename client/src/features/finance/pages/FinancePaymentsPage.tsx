import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Building,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { usePayments, useInvoices, useRecordPaymentMutation } from '../hooks/useFinance';
import { formatINR, formatDate } from '@/utils/formatters';

export const FinancePaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'UPI'>('BANK_TRANSFER');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [recordError, setRecordError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = usePayments({
    paymentMethod: selectedMethod,
    search: searchQuery,
  });

  const { data: unpaidInvoicesData } = useInvoices({ status: 'ISSUED', limit: 50 });

  const payMutation = useRecordPaymentMutation();
  const paymentsList: any[] = data?.items || [];

  const totalCollected = paymentsList.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
  const wireVolume = paymentsList
    .filter((p: any) => p.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
  const cardVolume = paymentsList
    .filter((p: any) => p.paymentMethod === 'CREDIT_CARD')
    .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !payAmount) return;
    setRecordError(null);
    try {
      await payMutation.mutateAsync({
        invoiceId: selectedInvoiceId,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        transactionReference: payReference || undefined,
        notes: payNotes || undefined,
      });
      setIsRecordModalOpen(false);
      setSelectedInvoiceId('');
      setPayAmount('');
      setPayReference('');
      setPayNotes('');
      refetch();
    } catch (err: any) {
      setRecordError(err.response?.data?.message || err.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <CreditCard className="h-3.5 w-3.5" />
            Treasury &amp; Settlements
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17213a]">
            Payments Ledger
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Audit incoming customer remittances, bank wire credits, and gateway settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setRecordError(null);
              setIsRecordModalOpen(true);
            }}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Settled Remittances</p>
              <p className="text-xl font-bold text-emerald-700">{formatINR(totalCollected)}</p>
              <p className="text-[11px] text-emerald-600 font-medium">{paymentsList.length} Transactions</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Building className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Bank Wire / RTGS</p>
              <p className="text-xl font-bold text-[#17213a]">{formatINR(wireVolume)}</p>
              <p className="text-[11px] text-purple-600 font-medium">Direct Treasury Transfers</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Cards &amp; Online Gateway</p>
              <p className="text-xl font-bold text-[#17213a]">{formatINR(cardVolume)}</p>
              <p className="text-[11px] text-blue-600 font-medium">Corporate Card Settlements</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Method Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search by payment #, UTR reference, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Methods' },
            { id: 'BANK_TRANSFER', label: 'Bank Wire / RTGS' },
            { id: 'CREDIT_CARD', label: 'Credit Card' },
            { id: 'NET_BANKING', label: 'Net Banking' },
            { id: 'UPI', label: 'Corporate UPI' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedMethod(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedMethod === tab.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-semibold text-[#17213a]">Loading payments ledger...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-sm font-semibold text-red-700">Failed to load payments</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : paymentsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <CreditCard className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-sm font-bold text-[#17213a]">No payments recorded</h3>
              <p className="mt-1 text-xs text-gray-400 max-w-sm">
                Record incoming customer wire transfers or payments to update your AR ledger.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setIsRecordModalOpen(true)}
              >
                Record First Payment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="py-3 px-6 font-semibold">Payment #</th>
                    <th className="py-3 font-semibold">Invoice #</th>
                    <th className="py-3 font-semibold">Customer</th>
                    <th className="py-3 font-semibold">Method</th>
                    <th className="py-3 font-semibold">UTR / Reference</th>
                    <th className="py-3 font-semibold">Date Settled</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold text-right">Amount Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {paymentsList.map((p: any) => (
                    <tr key={p.id} className="group hover:bg-[#f8faff] transition">
                      <td className="py-3.5 px-6 font-bold text-[#17213a]">
                        {p.paymentNumber}
                      </td>

                      <td className="py-3.5 font-semibold text-[#3568ed]">
                        <div
                          onClick={() => navigate(`/finance/invoices/${p.invoiceId}`)}
                          className="flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <span>{p.invoice?.invoiceNumber || 'Invoice'}</span>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                      </td>

                      <td className="py-3.5 font-semibold text-[#17213a]">
                        {p.customer?.companyName}
                      </td>

                      <td className="py-3.5 text-gray-600 font-medium">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 font-mono text-[11px] text-gray-500">
                        {p.transactionReference}
                      </td>

                      <td className="py-3.5 text-gray-500">
                        {formatDate(p.paidAt)}
                      </td>

                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Settled
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right font-bold text-emerald-700 text-sm">
                        {formatINR(parseFloat(p.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record New Customer Payment"
        description="Select an open invoice and record the remittance details."
        maxWidth="md"
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
          {recordError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {recordError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Select Outstanding Invoice
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => {
                setSelectedInvoiceId(e.target.value);
                const match = unpaidInvoicesData?.items?.find((i: any) => i.id === e.target.value);
                if (match) {
                  setPayAmount(match.balanceDue);
                }
              }}
              required
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Invoice --</option>
              {unpaidInvoicesData?.items?.map((inv: any) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customer?.companyName} (Due: {formatINR(parseFloat(inv.balanceDue))})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Payment Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-bold text-[#17213a] focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="BANK_TRANSFER">Bank Wire Transfer / NEFT / RTGS</option>
              <option value="CREDIT_CARD">Corporate Credit Card</option>
              <option value="NET_BANKING">Net Banking Portal</option>
              <option value="UPI">Corporate UPI</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Transaction Reference / UTR Number
            </label>
            <input
              type="text"
              placeholder="E.g., UTR-8721984210"
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="E.g., Direct bank settlement verified by treasury..."
              rows={2}
              className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={payMutation.isPending}
            >
              {payMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
