import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInvoice, usePayInvoice } from '../hooks';
import {
  StatusBadge,
  CustomerLoadingState,
  CustomerErrorState,
  PayInvoiceModal,
} from '../components';
import {
  ArrowLeft,
  CreditCard,
  Printer,
} from 'lucide-react';

export const CustomerInvoiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const { data: invoice, isLoading, isError, refetch } = useInvoice(id || '');
  const payMutation = usePayInvoice(id || '');

  if (isLoading) {
    return <CustomerLoadingState message="Loading invoice billing breakdown..." />;
  }

  if (isError || !invoice) {
    return (
      <CustomerErrorState
        title="Invoice Not Found"
        message="The requested commercial tax invoice could not be located."
        onRetry={() => refetch()}
      />
    );
  }

  const hasBalance = parseFloat(invoice.balanceDue) > 0;

  const handlePay = (paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI') => {
    payMutation.mutate(
      {
        amount: invoice.balanceDue,
        paymentMethod,
      },
      {
        onSuccess: () => {
          setIsPayModalOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            to="/customer/invoices"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#59657d] shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
                Invoice {invoice.invoiceNumber}
              </h1>
              <StatusBadge status={invoice.status} size="lg" />
            </div>
            <p className="text-xs text-[#8491aa] mt-0.5">
              Order Ref:{' '}
              <Link
                to={`/customer/orders/${invoice.orderId}`}
                className="font-bold text-[#3568ed] hover:underline"
              >
                {invoice.orderNumber}
              </Link>{' '}
              • Issued on {new Date(invoice.issueDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#59657d] shadow-sm hover:bg-slate-50 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </button>

          {hasBalance && (
            <button
              type="button"
              onClick={() => setIsPayModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#3568ed]/20 hover:bg-[#274fc1] transition"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay Outstanding ₹ {parseFloat(invoice.balanceDue).toLocaleString()}</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Details Card */}
      <div className="rounded-3xl border border-[#e7ebf7] bg-white p-8 shadow-[0_4px_24px_rgba(64,86,145,0.06)] space-y-8">
        {/* Top Meta Details */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#f0f3fa] pb-6 text-xs">
          <div>
            <p className="font-bold uppercase tracking-wider text-[#8491aa]">Billed To</p>
            <p className="mt-1 font-bold text-[#17213a] text-sm">{invoice.customerName}</p>
            <p className="mt-0.5 text-[#647592]">Account ID: {invoice.customerId}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-[#8491aa]">Payment Terms</p>
            <p className="mt-1 font-bold text-[#17213a] text-sm">Net 30 Days</p>
            <p className="mt-0.5 text-[#647592]">
              Due by {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-[#8491aa]">Total Invoiced</p>
            <p className="mt-1 font-extrabold text-[#17213a] text-base">
              ₹ {parseFloat(invoice.totalAmount).toLocaleString()}
            </p>
            <p className="mt-0.5 text-[#647592]">Currency: {invoice.currency}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-[#8491aa]">Settlement Status</p>
            <p className="mt-1 font-extrabold text-base">
              {hasBalance ? (
                <span className="text-amber-600">
                  ₹ {parseFloat(invoice.balanceDue).toLocaleString()} Due
                </span>
              ) : (
                <span className="text-emerald-600">Settled in Full</span>
              )}
            </p>
            <p className="mt-0.5 text-[#647592]">
              Amount Paid: ₹ {parseFloat(invoice.amountPaid).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <h3 className="text-sm font-bold text-[#17213a] mb-3">Itemized Billing</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e7ebf7] bg-[#f8faff] text-[#647592]">
                <tr>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Item Description</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-center">Qty</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Rate</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#17213a]">{item.productName}</p>
                      <p className="text-[11px] text-[#8491aa]">SKU: {item.sku}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#17213a]">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-medium text-[#59657d]">
                      ₹ {parseFloat(item.unitPrice).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#17213a]">
                      ₹ {parseFloat(item.netAmount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end border-t border-[#f0f3fa] pt-6">
          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-[#647592]">
              <span>Subtotal:</span>
              <span className="font-bold text-[#17213a]">
                ₹ {parseFloat(invoice.subtotal).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Commercial Discount:</span>
              <span className="font-bold">
                - ₹ {parseFloat(invoice.discountAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[#647592]">
              <span>GST / Statutory Tax:</span>
              <span className="font-bold text-[#17213a]">
                ₹ {parseFloat(invoice.taxAmount).toLocaleString()}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-[#17213a]">
              <span>Total Invoice Amount:</span>
              <span className="font-extrabold text-[#3568ed]">
                ₹ {parseFloat(invoice.totalAmount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-[#647592]">
              <span>Amount Paid:</span>
              <span>₹ {parseFloat(invoice.amountPaid).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-amber-600 border-t border-dashed border-slate-200 pt-2">
              <span>Balance Due:</span>
              <span>₹ {parseFloat(invoice.balanceDue).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Invoice Modal */}
      {isPayModalOpen && (
        <PayInvoiceModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onPay={handlePay}
          invoice={invoice}
          isProcessing={payMutation.isPending}
        />
      )}
    </div>
  );
};
