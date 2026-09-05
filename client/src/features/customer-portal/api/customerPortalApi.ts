import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';
import {
  CustomerDashboardMetrics,
  CustomerQuotationDetail,
  CustomerOrder,
  CustomerInvoice,
  CustomerPayment,
  CustomerSubscription,
  CustomerNotification,
  CustomerProfile,
  NegotiationSubmissionInput,
} from '../types';

export const customerPortalApi = {
  // Dashboard
  getDashboard: async (): Promise<CustomerDashboardMetrics> => {
    const response = await apiClient.get<ApiResponse<CustomerDashboardMetrics>>('/customer-portal/dashboard');
    return response.data.data!;
  },

  // Quotations
  getQuotations: async (params?: { search?: string; status?: string }): Promise<CustomerQuotationDetail[]> => {
    const response = await apiClient.get<ApiResponse<CustomerQuotationDetail[]>>('/customer-portal/quotations', {
      params,
    });
    return response.data.data || [];
  },

  getQuotationById: async (id: string): Promise<CustomerQuotationDetail> => {
    const response = await apiClient.get<ApiResponse<CustomerQuotationDetail>>(`/customer-portal/quotations/${id}`);
    return response.data.data!;
  },

  submitNegotiation: async (
    id: string,
    data: NegotiationSubmissionInput
  ): Promise<CustomerQuotationDetail> => {
    const response = await apiClient.post<ApiResponse<CustomerQuotationDetail>>(
      `/customer-portal/quotations/${id}/negotiate`,
      data
    );
    return response.data.data!;
  },

  confirmQuotation: async (
    id: string
  ): Promise<{ quotation: CustomerQuotationDetail; order: CustomerOrder }> => {
    const response = await apiClient.post<ApiResponse<{ quotation: CustomerQuotationDetail; order: CustomerOrder }>>(
      `/customer-portal/quotations/${id}/confirm`
    );
    return response.data.data!;
  },

  // Orders
  getOrders: async (): Promise<CustomerOrder[]> => {
    const response = await apiClient.get<ApiResponse<CustomerOrder[]>>('/customer-portal/orders');
    return response.data.data || [];
  },

  getOrderById: async (id: string): Promise<CustomerOrder> => {
    const response = await apiClient.get<ApiResponse<CustomerOrder>>(`/customer-portal/orders/${id}`);
    return response.data.data!;
  },

  // Invoices
  getInvoices: async (): Promise<CustomerInvoice[]> => {
    const response = await apiClient.get<ApiResponse<CustomerInvoice[]>>('/customer-portal/invoices');
    return response.data.data || [];
  },

  getInvoiceById: async (id: string): Promise<CustomerInvoice> => {
    const response = await apiClient.get<ApiResponse<CustomerInvoice>>(`/customer-portal/invoices/${id}`);
    return response.data.data!;
  },

  payInvoice: async (
    id: string,
    data: { amount: string; paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI' }
  ): Promise<{ invoice: CustomerInvoice; payment: CustomerPayment }> => {
    const response = await apiClient.post<ApiResponse<{ invoice: CustomerInvoice; payment: CustomerPayment }>>(
      `/customer-portal/invoices/${id}/pay`,
      data
    );
    return response.data.data!;
  },

  // Payments
  getPayments: async (): Promise<CustomerPayment[]> => {
    const response = await apiClient.get<ApiResponse<CustomerPayment[]>>('/customer-portal/payments');
    return response.data.data || [];
  },

  // Subscriptions
  getSubscriptions: async (): Promise<CustomerSubscription[]> => {
    const response = await apiClient.get<ApiResponse<CustomerSubscription[]>>('/customer-portal/subscriptions');
    return response.data.data || [];
  },

  getSubscriptionById: async (id: string): Promise<CustomerSubscription> => {
    const response = await apiClient.get<ApiResponse<CustomerSubscription>>(`/customer-portal/subscriptions/${id}`);
    return response.data.data!;
  },

  // Notifications
  getNotifications: async (): Promise<CustomerNotification[]> => {
    const response = await apiClient.get<ApiResponse<CustomerNotification[]>>('/customer-portal/notifications');
    return response.data.data || [];
  },

  markNotificationRead: async (id: string): Promise<boolean> => {
    const response = await apiClient.patch<ApiResponse<{ success: boolean }>>(`/customer-portal/notifications/${id}/read`);
    return response.data.data?.success ?? true;
  },

  markAllNotificationsRead: async (): Promise<boolean> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>('/customer-portal/notifications/mark-all-read');
    return response.data.data?.success ?? true;
  },

  // Profile
  getProfile: async (): Promise<CustomerProfile> => {
    const response = await apiClient.get<ApiResponse<CustomerProfile>>('/customer-portal/profile');
    return response.data.data!;
  },

  updateProfile: async (data: Partial<CustomerProfile>): Promise<CustomerProfile> => {
    const response = await apiClient.patch<ApiResponse<CustomerProfile>>('/customer-portal/profile', data);
    return response.data.data!;
  },
};
