import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, usePayInvoice } from '../hooks';
import {
  StatusBadge,
  CustomerLoadingState,
  CustomerEmptyState,
  CustomerErrorState,
  PayInvoiceModal,
} from '../components';
import { Receipt, Eye, CreditCard } from 'lucide-react';
import { CustomerInvoice } from '../types';

export const CustomerInvoicesPage: React.FC = () => {
  const { data: invoices, isLoading, isError, refetch } = useInvoices();
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<CustomerInvoice | null>(null);

  const payMutation = usePayInvoice(selectedInvoiceForPay?.id || '');

  if (isLoading) {
    return <CustomerLoadingState message="Loading your invoices..." />;
  }

  if (isError) {
    return <CustomerErrorState onRetry={() => refetch()} />;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <CustomerEmptyState
        title="No Invoices Found"
        description="There are currently no billing invoices issued for your account."
        icon={Receipt}
      />
    );
  }

  const handlePay = (paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI') => {
    if (!selectedInvoiceForPay) return;
    payMutation.mutate(
      {
        amount: selectedInvoiceForPay.balanceDue,
        paymentMethod,
      },
      {
        onSuccess: () => {
          setSelectedInvoiceForPay(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">Invoices & Billing</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Review issued commercial tax invoices, balance settlements, and payment history.
        </p>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-3xl border border-[#e7ebf7] bg-white shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e7ebf7] bg-[#f8faff] text-[#647592]">
              <tr>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Invoice #</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Order Ref</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Issue Date</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Due Date</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Total Amount</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Balance Due</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3fa]">
              {invoices.map((inv) => {
                const hasBalance = parseFloat(inv.balanceDue) > 0;
                return (
                  <tr key={inv.id} className="transition hover:bg-[#fcfdff]">
                    <td className="py-4 px-6">
                      <Link
                        to={`/customer/invoices/${inv.id}`}
                        className="font-bold text-[#3568ed] hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium text-[#17213a]">
                      <Link
                        to={`/customer/orders/${inv.orderId}`}
                        className="text-[#647592] hover:text-[#3568ed]"
                      >
                        {inv.orderNumber}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium text-[#17213a]">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-medium text-[#17213a]">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-[#17213a]">
                      ₹ {parseFloat(inv.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-bold">
                      {hasBalance ? (
                        <span className="text-amber-600">
                          ₹ {parseFloat(inv.balanceDue).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600">₹ 0.00</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        {hasBalance && (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForPay(inv)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3568ed] px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-[#3568ed]/20 transition hover:bg-[#274fc1]"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Pay</span>
                          </button>
                        )}
                        <Link
                          to={`/customer/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#3568ed] shadow-sm transition hover:bg-[#edf4ff] hover:border-[#3568ed]/40"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoiceForPay && (
        <PayInvoiceModal
          isOpen={Boolean(selectedInvoiceForPay)}
          onClose={() => setSelectedInvoiceForPay(null)}
          onPay={handlePay}
          invoice={selectedInvoiceForPay}
          isProcessing={payMutation.isPending}
        />
      )}
    </div>
  );
};
