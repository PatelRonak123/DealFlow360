import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  CreditCard,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useInvoices, useGenerateInvoiceMutation, useRecordPaymentMutation } from '../hooks/useFinance';
import { formatINR, formatDate } from '@/utils/formatters';

export const FinanceInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Generate Invoice Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [quotationIdInput, setQuotationIdInput] = useState('');
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Quick Record Payment Modal
  const [invoiceToPay, setInvoiceToPay] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'UPI'>('BANK_TRANSFER');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useInvoices({
    status: selectedStatus,
    search: searchQuery,
  });

  const generateMutation = useGenerateInvoiceMutation();
  const payMutation = useRecordPaymentMutation();

  const invoicesList: any[] = data?.items || [];

  const totalInvoiced = invoicesList.reduce((sum: number, inv: any) => sum + (parseFloat(inv.totalAmount) || 0), 0);
  const totalOutstanding = invoicesList.reduce((sum: number, inv: any) => sum + (parseFloat(inv.balanceDue) || 0), 0);
  const totalCollected = invoicesList.reduce((sum: number, inv: any) => sum + (parseFloat(inv.amountPaid) || 0), 0);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationIdInput.trim()) return;
    setGenerateError(null);
    try {
      const created = await generateMutation.mutateAsync(quotationIdInput.trim());
      setIsGenerateModalOpen(false);
      setQuotationIdInput('');
      navigate(`/finance/invoices/${created.id}`);
    } catch (err: any) {
      setGenerateError(err.response?.data?.message || err.message || 'Failed to generate invoice.');
    }
  };

  const handleOpenPayModal = (inv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvoiceToPay(inv);
    setPayAmount(inv.balanceDue);
    setPayReference('');
    setPayNotes('');
    setPayError(null);
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceToPay) return;
    setPayError(null);
    try {
      await payMutation.mutateAsync({
        invoiceId: invoiceToPay.id,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        transactionReference: payReference || undefined,
        notes: payNotes || undefined,
      });
      setInvoiceToPay(null);
      refetch();
    } catch (err: any) {
      setPayError(err.response?.data?.message || err.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Receipt className="h-3.5 w-3.5" />
            Billing &amp; Receivables
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17213a]">
            Commercial Tax Invoices
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Manage enterprise invoices, tax compliance, and client billing balances.
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsGenerateModalOpen(true)}
          >
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Invoiced</p>
              <p className="text-xl font-bold text-[#17213a]">{formatINR(totalInvoiced)}</p>
              <p className="text-[11px] text-blue-600 font-medium">{invoicesList.length} Active Invoices</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Collected Volume</p>
              <p className="text-xl font-bold text-emerald-700">{formatINR(totalCollected)}</p>
              <p className="text-[11px] text-emerald-600 font-medium">Successfully credited</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Outstanding Balance Due</p>
              <p className="text-xl font-bold text-rose-700">{formatINR(totalOutstanding)}</p>
              <p className="text-[11px] text-gray-500 font-medium">Pending collections</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice #, order #, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedStatus === st
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-semibold text-[#17213a]">Loading invoices...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-sm font-semibold text-red-700">Failed to load invoices</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : invoicesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Receipt className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-sm font-bold text-[#17213a]">No invoices found</h3>
              <p className="mt-1 text-xs text-gray-400 max-w-sm">
                Generate an invoice from a confirmed customer quotation to get started.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setIsGenerateModalOpen(true)}
              >
                Generate First Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                    <th className="py-3 px-6 font-semibold">Invoice #</th>
                    <th className="py-3 font-semibold">Customer</th>
                    <th className="py-3 font-semibold">Issue Date</th>
                    <th className="py-3 font-semibold">Due Date</th>
                    <th className="py-3 font-semibold">Total Amount</th>
                    <th className="py-3 font-semibold">Balance Due</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f5fb]">
                  {invoicesList.map((inv: any) => {
                    const isFullyPaid = inv.status === 'PAID';
                    return (
                      <tr
                        key={inv.id}
                        className="group hover:bg-[#f8faff] transition"
                      >
                        <td className="py-3.5 px-6 font-bold text-[#3568ed]">
                          <div
                            onClick={() => navigate(`/finance/invoices/${inv.id}`)}
                            className="flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <span>{inv.invoiceNumber}</span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        </td>

                        <td className="py-3.5">
                          <p className="font-semibold text-[#17213a]">{inv.customer?.companyName}</p>
                          {inv.customer?.email && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{inv.customer.email}</p>
                          )}
                        </td>

                        <td className="py-3.5 text-gray-500">
                          {formatDate(inv.issueDate)}
                        </td>

                        <td className="py-3.5 text-gray-500">
                          {formatDate(inv.dueDate)}
                        </td>

                        <td className="py-3.5 font-bold text-[#17213a]">
                          {formatINR(parseFloat(inv.totalAmount))}
                        </td>

                        <td className="py-3.5 font-bold">
                          <span className={parseFloat(inv.balanceDue) > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                            {formatINR(parseFloat(inv.balanceDue))}
                          </span>
                        </td>

                        <td className="py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-blue-100 text-blue-800'
                                : inv.status === 'OVERDUE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px]"
                              onClick={() => navigate(`/finance/invoices/${inv.id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1 text-gray-500" />
                              View
                            </Button>

                            {!isFullyPaid && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                onClick={(e) => handleOpenPayModal(inv, e)}
                              >
                                <CreditCard className="h-3 w-3 mr-1 text-emerald-600" />
                                Pay
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Tax Invoice from Quotation"
        description="Select an approved quotation to convert into a commercial invoice."
        maxWidth="md"
      >
        <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
          {generateError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {generateError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#17213a] mb-1">
              Quotation ID or Quotation Number
            </label>
            <input
              type="text"
              placeholder="E.g., QT-20260905-XXXX or Quotation UUID"
              value={quotationIdInput}
              onChange={(e) => setQuotationIdInput(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={Boolean(invoiceToPay)}
        onClose={() => setInvoiceToPay(null)}
        title={`Record Payment for ${invoiceToPay?.invoiceNumber || 'Invoice'}`}
        description="Record incoming customer payment to update accounts receivable ledger."
        maxWidth="md"
      >
        {invoiceToPay && (
          <form onSubmit={handleConfirmPay} className="space-y-4 text-xs">
            {payError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {payError}
              </div>
            )}

            <div className="rounded-xl border border-[#e2e8f5] bg-slate-50/70 p-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold text-[#17213a]">{invoiceToPay.customer?.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Total:</span>
                <span className="font-semibold text-gray-700">{formatINR(parseFloat(invoiceToPay.totalAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Outstanding Balance:</span>
                <span className="font-bold text-rose-700">{formatINR(parseFloat(invoiceToPay.balanceDue))}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#17213a] mb-1">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={parseFloat(invoiceToPay.balanceDue)}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none font-bold text-[#17213a]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#17213a] mb-1">
                Payment Method
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs bg-white focus:border-emerald-500 focus:outline-none"
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
                placeholder="E.g., UTR-98721984214"
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setInvoiceToPay(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={payMutation.isPending}
              >
                {payMutation.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
