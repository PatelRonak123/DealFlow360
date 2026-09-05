import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/finance.api';

export const FINANCE_QUERY_KEYS = {
  dashboard: ['finance', 'dashboard'] as const,
  approvals: (params?: any) => ['finance', 'approvals', params] as const,
  dealReview: (id: string) => ['finance', 'deal-review', id] as const,
  invoices: (params?: any) => ['finance', 'invoices', params] as const,
  invoice: (id: string) => ['finance', 'invoice', id] as const,
  payments: (params?: any) => ['finance', 'payments', params] as const,
  payment: (id: string) => ['finance', 'payment', id] as const,
};

export function useFinanceDashboard() {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.dashboard,
    queryFn: () => financeApi.getDashboardMetrics(),
    staleTime: 30 * 1000,
  });
}

export function useFinanceApprovals(params: { status?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.approvals(params),
    queryFn: () => financeApi.getApprovals(params),
    staleTime: 15 * 1000,
  });
}

export function useFinancialDealReview(id: string) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.dealReview(id),
    queryFn: () => financeApi.getDealReview(id),
    enabled: Boolean(id),
    staleTime: 15 * 1000,
  });
}

export function useInvoices(params: { status?: string; customerId?: string; search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.invoices(params),
    queryFn: () => financeApi.getInvoices(params),
    staleTime: 20 * 1000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.invoice(id),
    queryFn: () => financeApi.getInvoiceById(id),
    enabled: Boolean(id),
    staleTime: 20 * 1000,
  });
}

export function usePayments(params: { invoiceId?: string; customerId?: string; status?: string; paymentMethod?: string; search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.payments(params),
    queryFn: () => financeApi.getPayments(params),
    staleTime: 20 * 1000,
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: FINANCE_QUERY_KEYS.payment(id),
    queryFn: () => financeApi.getPaymentById(id),
    enabled: Boolean(id),
    staleTime: 20 * 1000,
  });
}

// Mutations
export function useApproveFinanceDealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => financeApi.approveDeal(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useRejectFinanceDealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) => financeApi.rejectDeal(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useReturnFinanceDealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) => financeApi.returnDeal(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useGenerateInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotationId: string) => financeApi.generateFromQuotation(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useRecordPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      invoiceId: string;
      amount: number | string;
      paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'UPI';
      transactionReference?: string;
      notes?: string;
    }) => financeApi.recordPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}
