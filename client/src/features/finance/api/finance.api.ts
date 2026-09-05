import { apiClient } from '@/api/apiClient';
import {
  FinanceDashboardData,
  FinancialDealReviewData,
  InvoiceItemData,
  PaymentItemData,
} from '../types/finance.types';

export const financeApi = {
  // Dashboard Metrics
  getDashboardMetrics: async (): Promise<FinanceDashboardData> => {
    const res = await apiClient.get<{ success: boolean; data: FinanceDashboardData }>('/finance/dashboard');
    return res.data.data;
  },

  // Finance Approvals
  getApprovals: async (params: { status?: string; page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<{ success: boolean; data: { items: any[]; total: number } }>('/finance/approvals', {
      params,
    });
    return res.data.data;
  },

  getDealReview: async (id: string): Promise<FinancialDealReviewData> => {
    const res = await apiClient.get<{ success: boolean; data: FinancialDealReviewData }>(`/finance/approvals/${id}`);
    return res.data.data;
  },

  approveDeal: async (id: string, comments?: string) => {
    const res = await apiClient.post(`/finance/approvals/${id}/approve`, { comments });
    return res.data;
  },

  rejectDeal: async (id: string, comments: string) => {
    const res = await apiClient.post(`/finance/approvals/${id}/reject`, { comments });
    return res.data;
  },

  returnDeal: async (id: string, comments: string) => {
    const res = await apiClient.post(`/finance/approvals/${id}/return`, { comments });
    return res.data;
  },

  // Invoices API
  getInvoices: async (params: { status?: string; customerId?: string; search?: string; page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { items: InvoiceItemData[]; total: number; page: number; limit: number; totalPages: number };
    }>('/invoices', { params });
    return res.data.data;
  },

  getInvoiceById: async (id: string): Promise<InvoiceItemData> => {
    const res = await apiClient.get<{ success: boolean; data: InvoiceItemData }>(`/invoices/${id}`);
    return res.data.data;
  },

  generateFromQuotation: async (quotationId: string) => {
    const res = await apiClient.post<{ success: boolean; data: InvoiceItemData }>('/invoices/generate-from-quotation', {
      quotationId,
    });
    return res.data.data;
  },

  createManualInvoice: async (payload: any) => {
    const res = await apiClient.post<{ success: boolean; data: InvoiceItemData }>('/invoices', payload);
    return res.data.data;
  },

  updateInvoiceStatus: async (id: string, status: string) => {
    const res = await apiClient.patch(`/invoices/${id}/status`, { status });
    return res.data.data;
  },

  // Payments API
  getPayments: async (params: { invoiceId?: string; customerId?: string; status?: string; paymentMethod?: string; search?: string; page?: number; limit?: number } = {}) => {
    const res = await apiClient.get<{
      success: boolean;
      data: { items: PaymentItemData[]; total: number; page: number; limit: number; totalPages: number };
    }>('/payments', { params });
    return res.data.data;
  },

  getPaymentById: async (id: string): Promise<PaymentItemData> => {
    const res = await apiClient.get<{ success: boolean; data: PaymentItemData }>(`/payments/${id}`);
    return res.data.data;
  },

  recordPayment: async (payload: {
    invoiceId: string;
    amount: number | string;
    paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'UPI';
    transactionReference?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: { payment: PaymentItemData; invoice: InvoiceItemData } }>(
      '/payments',
      payload
    );
    return res.data.data;
  },
};
