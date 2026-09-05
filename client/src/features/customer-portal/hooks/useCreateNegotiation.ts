import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '../api/customerPortalApi';
import { NegotiationSubmissionInput } from '../types';
import { CUSTOMER_DASHBOARD_QUERY_KEY } from './useCustomerDashboard';
import { CUSTOMER_QUOTATIONS_QUERY_KEY } from './useCustomerQuotations';
import { CUSTOMER_NOTIFICATIONS_QUERY_KEY } from './useNotifications';

export function useCreateNegotiation(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NegotiationSubmissionInput) =>
      customerPortalApi.submitNegotiation(quotationId, data),
    onSuccess: (updatedQuote) => {
      // Invalidate target quotation
      queryClient.invalidateQueries({ queryKey: ['customer-portal', 'quotations', quotationId] });
      // Invalidate quotation list
      queryClient.invalidateQueries({ queryKey: CUSTOMER_QUOTATIONS_QUERY_KEY });
      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ queryKey: CUSTOMER_DASHBOARD_QUERY_KEY });
      // Invalidate notifications
      queryClient.invalidateQueries({ queryKey: CUSTOMER_NOTIFICATIONS_QUERY_KEY });

      // Direct cache update for instant UI feedback
      queryClient.setQueryData(['customer-portal', 'quotations', quotationId], updatedQuote);
    },
  });
}
