import {
  customerPortalRepository,
  CustomerPortalRepository,
} from '../repositories/customerPortal.repository.js';
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
} from '../types/customerPortal.types.js';
import { NotFoundError, BadRequestError } from '../../../common/errors/index.js';

export class CustomerPortalService {
  constructor(private readonly repository: CustomerPortalRepository = customerPortalRepository) {}

  async getDashboard(customerId?: string, userEmail?: string): Promise<CustomerDashboardMetrics> {
    return this.repository.getDashboardMetrics(customerId, userEmail);
  }

  async listQuotations(
    query?: { search?: string; status?: string },
    customerId?: string,
    userEmail?: string
  ): Promise<CustomerQuotationDetail[]> {
    return this.repository.findQuotations(query, customerId, userEmail);
  }

  async getQuotationById(id: string, customerId?: string, userEmail?: string): Promise<CustomerQuotationDetail> {
    const quotation = await this.repository.findQuotationById(id, customerId, userEmail);
    if (!quotation) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }
    return quotation;
  }

  async submitNegotiation(
    quotationId: string,
    input: NegotiationSubmissionInput,
    customerId?: string,
    userEmail?: string,
    userName?: string
  ): Promise<CustomerQuotationDetail> {
    if (input.requestedDiscountPercent < 0 || input.requestedDiscountPercent > 100) {
      throw new BadRequestError('Requested discount must be between 0% and 100%');
    }
    return this.repository.submitNegotiation(quotationId, input, customerId, userEmail, userName);
  }

  async confirmQuotation(
    quotationId: string,
    customerId?: string,
    userEmail?: string
  ): Promise<{ quotation: CustomerQuotationDetail; order: CustomerOrder }> {
    const quote = await this.getQuotationById(quotationId, customerId, userEmail);
    if (quote.status === 'CONFIRMED') {
      throw new BadRequestError(`Quotation ${quote.quotationNumber} is already confirmed`);
    }
    return this.repository.confirmQuotation(quotationId, customerId, userEmail);
  }

  async listOrders(customerId?: string, userEmail?: string): Promise<CustomerOrder[]> {
    return this.repository.findOrders(customerId, userEmail);
  }

  async getOrderById(id: string, customerId?: string, userEmail?: string): Promise<CustomerOrder> {
    const order = await this.repository.findOrderById(id, customerId, userEmail);
    if (!order) {
      throw new NotFoundError(`Order with ID '${id}' not found`);
    }
    return order;
  }

  async listInvoices(customerId?: string, userEmail?: string): Promise<CustomerInvoice[]> {
    return this.repository.findInvoices(customerId, userEmail);
  }

  async getInvoiceById(id: string, customerId?: string, userEmail?: string): Promise<CustomerInvoice> {
    const invoice = await this.repository.findInvoiceById(id, customerId, userEmail);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID '${id}' not found`);
    }
    return invoice;
  }

  async payInvoice(
    invoiceId: string,
    input: { amount: string; paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI' },
    customerId?: string,
    userEmail?: string
  ): Promise<{ invoice: CustomerInvoice; payment: CustomerPayment }> {
    return this.repository.payInvoice(invoiceId, input, customerId, userEmail);
  }

  async listPayments(customerId?: string, userEmail?: string): Promise<CustomerPayment[]> {
    return this.repository.findPayments(customerId, userEmail);
  }

  async listSubscriptions(customerId?: string, userEmail?: string): Promise<CustomerSubscription[]> {
    return this.repository.findSubscriptions(customerId, userEmail);
  }

  async getSubscriptionById(id: string, customerId?: string, userEmail?: string): Promise<CustomerSubscription> {
    const sub = await this.repository.findSubscriptionById(id, customerId, userEmail);
    if (!sub) {
      throw new NotFoundError(`Subscription with ID '${id}' not found`);
    }
    return sub;
  }

  async listNotifications(customerId?: string, userEmail?: string): Promise<CustomerNotification[]> {
    return this.repository.findNotifications(customerId, userEmail);
  }

  async markNotificationRead(id: string): Promise<boolean> {
    return this.repository.markNotificationAsRead(id);
  }

  async markAllNotificationsRead(): Promise<boolean> {
    return this.repository.markAllNotificationsAsRead();
  }

  async getProfile(customerId?: string, userEmail?: string, userName?: string): Promise<CustomerProfile> {
    return this.repository.getProfile(customerId, userEmail, userName);
  }

  async updateProfile(
    data: Partial<CustomerProfile>,
    customerId?: string,
    userEmail?: string,
    userName?: string
  ): Promise<CustomerProfile> {
    return this.repository.updateProfile(data, customerId, userEmail, userName);
  }
}

export const customerPortalService = new CustomerPortalService();
