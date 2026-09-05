import React from 'react';
import { Link } from 'react-router-dom';
import { usePayments } from '../hooks';
import { StatusBadge, CustomerLoadingState, CustomerEmptyState, CustomerErrorState } from '../components';
import { CreditCard, ShieldCheck } from 'lucide-react';

export const CustomerPaymentsPage: React.FC = () => {
  const { data: payments, isLoading, isError, refetch } = usePayments();

  if (isLoading) {
    return <CustomerLoadingState message="Loading your payment transaction history..." />;
  }

  if (isError) {
    return <CustomerErrorState onRetry={() => refetch()} />;
  }

  if (!payments || payments.length === 0) {
    return (
      <CustomerEmptyState
        title="No Payments Recorded"
        description="There are no payment settlements recorded on your account yet."
        icon={CreditCard}
        actionText="View Invoices"
        actionHref="/customer/invoices"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">Payment History</h1>
        <p className="mt-1 text-sm text-[#647592]">
          Audited digital transaction logs and settlement references for completed invoices.
        </p>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-3xl border border-[#e7ebf7] bg-white shadow-[0_4px_20px_rgba(64,86,145,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e7ebf7] bg-[#f8faff] text-[#647592]">
              <tr>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Payment #</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Invoice Ref</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Order Ref</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Date & Time</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Payment Method</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Amount</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3fa]">
              {payments.map((pay) => (
                <tr key={pay.id} className="transition hover:bg-[#fcfdff]">
                  <td className="py-4 px-6 font-bold text-[#17213a]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>{pay.paymentNumber}</span>
                    </div>
                    <p className="text-[11px] text-[#8491aa] font-mono mt-0.5">
                      Ref: {pay.transactionReference}
                    </p>
                  </td>
                  <td className="py-4 px-6 font-semibold">
                    <Link
                      to={`/customer/invoices/${pay.invoiceId}`}
                      className="text-[#3568ed] hover:underline"
                    >
                      {pay.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-4 px-6 font-medium text-[#647592]">{pay.orderNumber}</td>
                  <td className="py-4 px-6 font-medium text-[#17213a]">
                    {new Date(pay.paidAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-4 px-6 font-semibold text-[#17213a]">
                    {pay.paymentMethod.replace('_', ' ')}
                  </td>
                  <td className="py-4 px-6 font-extrabold text-[#17213a]">
                    ₹ {parseFloat(pay.amount).toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={pay.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
