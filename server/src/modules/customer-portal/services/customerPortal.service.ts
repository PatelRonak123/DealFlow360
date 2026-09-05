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

  async getDashboard(customerId?: string): Promise<CustomerDashboardMetrics> {
    return this.repository.getDashboardMetrics(customerId);
  }

  async listQuotations(
    query?: { search?: string; status?: string },
    customerId?: string
  ): Promise<CustomerQuotationDetail[]> {
    return this.repository.findQuotations(query, customerId);
  }

  async getQuotationById(id: string, customerId?: string): Promise<CustomerQuotationDetail> {
    const quotation = await this.repository.findQuotationById(id, customerId);
    if (!quotation) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }
    return quotation;
  }

  async submitNegotiation(
    quotationId: string,
    input: NegotiationSubmissionInput,
    customerId?: string
  ): Promise<CustomerQuotationDetail> {
    if (input.requestedDiscountPercent < 0 || input.requestedDiscountPercent > 100) {
      throw new BadRequestError('Requested discount must be between 0% and 100%');
    }
    return this.repository.submitNegotiation(quotationId, input, customerId);
  }

  async confirmQuotation(
    quotationId: string,
    customerId?: string
  ): Promise<{ quotation: CustomerQuotationDetail; order: CustomerOrder }> {
    const quote = await this.getQuotationById(quotationId, customerId);
    if (quote.status === 'CONFIRMED') {
      throw new BadRequestError(`Quotation ${quote.quotationNumber} is already confirmed`);
    }
    return this.repository.confirmQuotation(quotationId, customerId);
  }

  async listOrders(customerId?: string): Promise<CustomerOrder[]> {
    return this.repository.findOrders(customerId);
  }

  async getOrderById(id: string, customerId?: string): Promise<CustomerOrder> {
    const order = await this.repository.findOrderById(id, customerId);
    if (!order) {
      throw new NotFoundError(`Order with ID '${id}' not found`);
    }
    return order;
  }

  async listInvoices(customerId?: string): Promise<CustomerInvoice[]> {
    return this.repository.findInvoices(customerId);
  }

  async getInvoiceById(id: string, customerId?: string): Promise<CustomerInvoice> {
    const invoice = await this.repository.findInvoiceById(id, customerId);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID '${id}' not found`);
    }
    return invoice;
  }

  async payInvoice(
    invoiceId: string,
    input: { amount: string; paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI' },
    customerId?: string
  ): Promise<{ invoice: CustomerInvoice; payment: CustomerPayment }> {
    return this.repository.payInvoice(invoiceId, input, customerId);
  }

  async listPayments(customerId?: string): Promise<CustomerPayment[]> {
    return this.repository.findPayments(customerId);
  }

  async listSubscriptions(customerId?: string): Promise<CustomerSubscription[]> {
    return this.repository.findSubscriptions(customerId);
  }

  async getSubscriptionById(id: string, customerId?: string): Promise<CustomerSubscription> {
    const sub = await this.repository.findSubscriptionById(id, customerId);
    if (!sub) {
      throw new NotFoundError(`Subscription with ID '${id}' not found`);
    }
    return sub;
  }

  async listNotifications(customerId?: string): Promise<CustomerNotification[]> {
    return this.repository.findNotifications(customerId);
  }

  async markNotificationRead(id: string): Promise<boolean> {
    return this.repository.markNotificationAsRead(id);
  }

  async markAllNotificationsRead(): Promise<boolean> {
    return this.repository.markAllNotificationsAsRead();
  }

  async getProfile(customerId?: string): Promise<CustomerProfile> {
    return this.repository.getProfile(customerId);
  }

  async updateProfile(data: Partial<CustomerProfile>, customerId?: string): Promise<CustomerProfile> {
    return this.repository.updateProfile(data, customerId);
  }
}

export const customerPortalService = new CustomerPortalService();

