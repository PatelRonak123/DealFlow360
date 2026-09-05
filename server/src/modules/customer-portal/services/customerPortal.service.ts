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

  async getDashboard(): Promise<CustomerDashboardMetrics> {
    return this.repository.getDashboardMetrics();
  }

  async listQuotations(query?: { search?: string; status?: string }): Promise<CustomerQuotationDetail[]> {
    return this.repository.findQuotations(query);
  }

  async getQuotationById(id: string): Promise<CustomerQuotationDetail> {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }
    return quotation;
  }

  async submitNegotiation(
    quotationId: string,
    input: NegotiationSubmissionInput
  ): Promise<CustomerQuotationDetail> {
    if (input.requestedDiscountPercent < 0 || input.requestedDiscountPercent > 100) {
      throw new BadRequestError('Requested discount must be between 0% and 100%');
    }
    return this.repository.submitNegotiation(quotationId, input);
  }

  async confirmQuotation(
    quotationId: string
  ): Promise<{ quotation: CustomerQuotationDetail; order: CustomerOrder }> {
    const quote = await this.getQuotationById(quotationId);
    if (quote.status === 'CONFIRMED') {
      throw new BadRequestError(`Quotation ${quote.quotationNumber} is already confirmed`);
    }
    return this.repository.confirmQuotation(quotationId);
  }

  async listOrders(): Promise<CustomerOrder[]> {
    return this.repository.findOrders();
  }

  async getOrderById(id: string): Promise<CustomerOrder> {
    const order = await this.repository.findOrderById(id);
    if (!order) {
      throw new NotFoundError(`Order with ID '${id}' not found`);
    }
    return order;
  }

  async listInvoices(): Promise<CustomerInvoice[]> {
    return this.repository.findInvoices();
  }

  async getInvoiceById(id: string): Promise<CustomerInvoice> {
    const invoice = await this.repository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID '${id}' not found`);
    }
    return invoice;
  }

  async payInvoice(
    invoiceId: string,
    input: { amount: string; paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI' }
  ): Promise<{ invoice: CustomerInvoice; payment: CustomerPayment }> {
    return this.repository.payInvoice(invoiceId, input);
  }

  async listPayments(): Promise<CustomerPayment[]> {
    return this.repository.findPayments();
  }

  async listSubscriptions(): Promise<CustomerSubscription[]> {
    return this.repository.findSubscriptions();
  }

  async getSubscriptionById(id: string): Promise<CustomerSubscription> {
    const sub = await this.repository.findSubscriptionById(id);
    if (!sub) {
      throw new NotFoundError(`Subscription with ID '${id}' not found`);
    }
    return sub;
  }

  async listNotifications(): Promise<CustomerNotification[]> {
    return this.repository.findNotifications();
  }

  async markNotificationRead(id: string): Promise<boolean> {
    return this.repository.markNotificationAsRead(id);
  }

  async markAllNotificationsRead(): Promise<boolean> {
    return this.repository.markAllNotificationsAsRead();
  }

  async getProfile(): Promise<CustomerProfile> {
    return this.repository.getProfile();
  }

  async updateProfile(data: Partial<CustomerProfile>): Promise<CustomerProfile> {
    return this.repository.updateProfile(data);
  }
}

export const customerPortalService = new CustomerPortalService();
