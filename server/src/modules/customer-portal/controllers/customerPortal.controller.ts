import { Request, Response, NextFunction } from 'express';
import { customerPortalService, CustomerPortalService } from '../services/customerPortal.service.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class CustomerPortalController {
  constructor(private readonly service: CustomerPortalService = customerPortalService) {}

  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.getDashboard();
      sendSuccess(res, data, 'Customer dashboard metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async listQuotations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status } = req.query;
      const data = await this.service.listQuotations({
        search: typeof search === 'string' ? search : undefined,
        status: typeof status === 'string' ? status : undefined,
      });
      sendSuccess(res, data, 'Quotations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getQuotationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.getQuotationById(id);
      sendSuccess(res, data, 'Quotation details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async submitNegotiation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { requestedDiscountPercent, reason, changeRequests, message } = req.body;
      const data = await this.service.submitNegotiation(id, {
        requestedDiscountPercent: Number(requestedDiscountPercent),
        reason: String(reason || ''),
        changeRequests: Array.isArray(changeRequests) ? changeRequests : undefined,
        message: message ? String(message) : undefined,
      });
      sendSuccess(res, data, 'Counter offer submitted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async confirmQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.confirmQuotation(id);
      sendSuccess(res, data, 'Quotation confirmed and order generated successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async listOrders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.listOrders();
      sendSuccess(res, data, 'Orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.getOrderById(id);
      sendSuccess(res, data, 'Order details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async listInvoices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.listInvoices();
      sendSuccess(res, data, 'Invoices retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.getInvoiceById(id);
      sendSuccess(res, data, 'Invoice details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async payInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, paymentMethod } = req.body;
      const data = await this.service.payInvoice(id, {
        amount: String(amount),
        paymentMethod: paymentMethod || 'NET_BANKING',
      });
      sendSuccess(res, data, 'Payment processed successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async listPayments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.listPayments();
      sendSuccess(res, data, 'Payments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async listSubscriptions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.listSubscriptions();
      sendSuccess(res, data, 'Subscriptions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await this.service.getSubscriptionById(id);
      sendSuccess(res, data, 'Subscription details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async listNotifications(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.listNotifications();
      sendSuccess(res, data, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.service.markNotificationRead(id);
      sendSuccess(res, { success }, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllNotificationsRead(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const success = await this.service.markAllNotificationsRead();
      sendSuccess(res, { success }, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.getProfile();
      sendSuccess(res, data, 'Customer profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.updateProfile(req.body);
      sendSuccess(res, data, 'Customer profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const customerPortalController = new CustomerPortalController();
