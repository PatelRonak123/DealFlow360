import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';
import { CUSTOMER_DASHBOARD_QUERY_KEY } from './useCustomerDashboard';
import { CUSTOMER_QUOTATIONS_QUERY_KEY } from './useCustomerQuotations';
import { CUSTOMER_ORDERS_QUERY_KEY } from './useCustomerOrders';
import { CUSTOMER_INVOICES_QUERY_KEY } from './useInvoices';
import { CUSTOMER_NOTIFICATIONS_QUERY_KEY } from './useNotifications';

export function useConfirmQuotation(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => customerPortalApi.confirmQuotation(quotationId),
    onSuccess: (result) => {
      // Invalidate target quotation
      queryClient.invalidateQueries({ queryKey: ['customer-portal', 'quotations', quotationId] });
      // Invalidate quotations list
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUOTATIONS_QUERY_KEY });
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: CUSTOMER_ORDERS_QUERY_KEY });
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: CUSTOMER_INVOICES_QUERY_KEY });
      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEY });
      // Invalidate notifications
      queryClient.invalidateQueries({ queryKey: CUSTOMER_NOTIFICATIONS_QUERY_KEY });

      // Direct cache update for instant UI feedback
      queryClient.setQueryData(['customer-portal', 'quotations', quotationId], result.quotation);
    },
  });
}
