import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Receipt,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useInvoice, useRecordPaymentMutation } from '../hooks/useFinance';
import { formatINR, formatDate } from '@/utils/formatters';

export const FinanceInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'UPI'>('BANK_TRANSFER');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(id || '');
  const payMutation = useRecordPaymentMutation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mb-3" />
        <p className="text-sm font-semibold text-[#17213a]">Loading commercial invoice details...</p>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#17213a]">Failed to load invoice</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          {(error as Error)?.message || 'The requested invoice was not found.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/finance/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isFullyPaid = invoice.status === 'PAID';
  const balanceNum = parseFloat(invoice.balanceDue) || 0;

  const handleOpenPayModal = () => {
    setPayAmount(invoice.balanceDue);
    setPayReference('');
    setPayNotes('');
    setPayError(null);
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    try {
      await payMutation.mutateAsync({
        invoiceId: invoice.id,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        transactionReference: payReference || undefined,
        notes: payNotes || undefined,
      });
      setIsPayModalOpen(false);
      refetch();
    } catch (err: any) {
      setPayError(err.response?.data?.message || err.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/finance/invoices')}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#17213a] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => window.print()}
          >
            Print / PDF
          </Button>
          {!isFullyPaid && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              leftIcon={<CreditCard className="h-4 w-4" />}
              onClick={handleOpenPayModal}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Main Invoice Card (Print-friendly structured layout) */}
      <Card className="p-8 border border-gray-200 bg-white shadow-xs space-y-8">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-base shadow-sm">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-bold tracking-tight text-[#17213a]">DealFlow360 Technologies Pvt Ltd</p>
                <p className="text-[11px] text-gray-400">GSTIN: 27AADCB2234P1Z4 &bull; Commercial Finance</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p className="font-semibold text-gray-700">Billing Address:</p>
              <p>Level 7, Cyber Tower, Hi-Tech City</p>
              <p>Hyderabad, Telangana, 500081, India</p>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                invoice.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.status === 'PARTIALLY_PAID'
                  ? 'bg-blue-100 text-blue-800'
                  : invoice.status === 'OVERDUE'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {invoice.status}
            </span>
            <h2 className="text-2xl font-bold text-[#17213a]">{invoice.invoiceNumber}</h2>
            <p className="text-xs text-gray-500">Issued: {formatDate(invoice.issueDate)}</p>
            <p className="text-xs text-gray-500">Due Date: {formatDate(invoice.dueDate)}</p>
            {invoice.orderNumber && (
              <p className="text-xs font-mono text-purple-700 pt-1">Ref Order: {invoice.orderNumber}</p>
            )}
          </div>
        </div>

        {/* Customer / Billed To Section */}
        <div className="rounded-xl border border-gray-100 bg-slate-50/70 p-5 text-xs">
          <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-2">Billed To (Customer):</p>
          <p className="text-sm font-bold text-[#17213a]">{invoice.customer?.companyName}</p>
          {invoice.customer?.contactName && (
            <p className="text-gray-600 mt-0.5">Attn: {invoice.customer.contactName}</p>
          )}
          {invoice.customer?.email && (
            <p className="text-gray-500 mt-0.5">{invoice.customer.email}</p>
          )}
          {invoice.customer?.phone && (
            <p className="text-gray-500 mt-0.5">{invoice.customer.phone}</p>
          )}
        </div>

        {/* Line Items Table */}
        <div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-2.5 font-semibold">Item &amp; Description</th>
                <th className="py-2.5 font-semibold text-center">Qty</th>
                <th className="py-2.5 font-semibold text-right">Unit Price</th>
                <th className="py-2.5 font-semibold text-right">Discount</th>
                <th className="py-2.5 font-semibold text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items?.map((item) => (
                <tr key={item.id} className="text-gray-700">
                  <td className="py-3">
                    <p className="font-semibold text-[#17213a]">{item.productNameSnapshot}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.skuSnapshot}</p>
                  </td>
                  <td className="py-3 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 text-right">{formatINR(parseFloat(item.unitPrice))}</td>
                  <td className="py-3 text-right font-medium text-amber-700">
                    {parseFloat(item.discountPercent) > 0 ? `${item.discountPercent}%` : '—'}
                  </td>
                  <td className="py-3 text-right font-bold text-[#17213a]">
                    {formatINR(parseFloat(item.netAmount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-gray-200 pt-6">
          <div className="text-xs text-gray-500 max-w-sm space-y-1">
            <p className="font-bold text-gray-700">Payment Terms &amp; Notes:</p>
            <p>Payment is due within 30 days of invoice date. Bank wire transfers or corporate portal payments accepted.</p>
            {invoice.notes && (
              <p className="pt-2 italic text-gray-600">&ldquo;{invoice.notes}&rdquo;</p>
            )}
          </div>

          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatINR(parseFloat(invoice.subtotal))}</span>
            </div>
            {parseFloat(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Discount:</span>
                <span className="font-semibold">-{formatINR(parseFloat(invoice.discountAmount))}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>GST / Tax (18%):</span>
              <span className="font-semibold">{formatINR(parseFloat(invoice.taxAmount))}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#17213a] border-t border-gray-200 pt-2">
              <span>Grand Total:</span>
              <span>{formatINR(parseFloat(invoice.totalAmount))}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-emerald-700">
              <span>Amount Paid:</span>
              <span>{formatINR(parseFloat(invoice.amountPaid))}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-rose-700 border-t border-gray-100 pt-1">
              <span>Balance Due:</span>
              <span>{formatINR(parseFloat(invoice.balanceDue))}</span>
            </div>
          </div>
        </div>

        {/* Payment History Table for this Invoice */}
        <div className="border-t border-gray-100 pt-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Payment Transaction History
          </h3>
          {!invoice.payments || invoice.payments.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No payments recorded for this invoice yet.</p>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase">
                    <th className="py-2.5 px-4">Payment #</th>
                    <th className="py-2.5">Method</th>
                    <th className="py-2.5">Reference</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5 px-4 text-right">Amount Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="text-gray-700">
                      <td className="py-2.5 px-4 font-bold text-purple-700">{p.paymentNumber}</td>
                      <td className="py-2.5">{p.paymentMethod}</td>
                      <td className="py-2.5 font-mono text-[11px] text-gray-500">{p.transactionReference}</td>
                      <td className="py-2.5 text-gray-500">{formatDate(p.paidAt)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                        {formatINR(parseFloat(p.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment for ${invoice.invoiceNumber}`}
        description="Apply payment against outstanding balance."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmPay} className="space-y-4 text-xs">
          {payError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {payError}
            </div>
          )}

          <div className="rounded-xl border border-[#e2e8f5] bg-slate-50/70 p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer:</span>
              <span className="font-bold text-[#17213a]">{invoice.customer?.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Remaining Balance:</span>
              <span className="font-bold text-rose-700">{formatINR(parseFloat(invoice.balanceDue))}</span>
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
              max={balanceNum}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs font-bold text-[#17213a] focus:border-emerald-500 focus:outline-none"
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
              placeholder="E.g., UTR-87612348712"
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsPayModalOpen(false)}>
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
      </Modal>
    </div>
  );
};
