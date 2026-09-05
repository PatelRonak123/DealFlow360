import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';
import { CUSTOMER_DASHBOARD_QUERY_KEY } from './useCustomerDashboard';

export const CUSTOMER_INVOICES_QUERY_KEY = ['customer-portal', 'invoices'] as const;
export const CUSTOMER_PAYMENTS_QUERY_KEY = ['customer-portal', 'payments'] as const;

export function useInvoices() {
  return useQuery({
    queryKey: CUSTOMER_INVOICES_QUERY_KEY,
    queryFn: () => customerPortalApi.getInvoices(),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['customer-portal', 'invoices', id],
    queryFn: () => customerPortalApi.getInvoiceById(id),
    enabled: Boolean(id),
  });
}

export function usePayments() {
  return useQuery({
    queryKey: CUSTOMER_PAYMENTS_QUERY_KEY,
    queryFn: () => customerPortalApi.getPayments(),
  });
}

export function usePayInvoice(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: string; paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI' }) =>
      customerPortalApi.payInvoice(invoiceId, data),
    onSuccess: (result) => {
      // Invalidate target invoice
      queryClient.invalidateQueries({ queryKey: ['customer-portal', 'invoices', invoiceId] });
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: CUSTOMER_INVOICES_QUERY_KEY });
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: CUSTOMER_PAYMENTS_QUERY_KEY });
      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEY });

      // Direct cache update
      queryClient.setQueryData(['customer-portal', 'invoices', invoiceId], result.invoice);
    },
  });
}
