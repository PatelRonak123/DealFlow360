import { Request, Response, NextFunction } from 'express';
import { customerPortalService, CustomerPortalService } from '../services/customerPortal.service.js';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';

export class CustomerPortalController {
  constructor(private readonly service: CustomerPortalService = customerPortalService) {}

  private getCustomerId(req: Request): string | undefined {
    return req.user?.customerId || undefined;
  }

  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const data = await this.service.getDashboard(customerId, userEmail);
      sendSuccess(res, data, 'Customer dashboard metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async listQuotations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { search, status, page, limit } = req.query;
      const result = await this.service.listQuotations(
        {
          search: typeof search === 'string' ? search : undefined,
          status: typeof status === 'string' ? status : undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
        customerId,
        userEmail
      );
      sendSuccess(
        res,
        result.items,
        'Quotations retrieved successfully',
        HttpStatus.OK,
        {
          page: result.page,
          limit: result.limit,
          pageSize: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPreviousPage: result.page > 1,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async getQuotationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { id } = req.params;
      const data = await this.service.getQuotationById(id, customerId, userEmail);
      sendSuccess(res, data, 'Quotation details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async submitNegotiation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const userName = req.user?.name;
      const { id } = req.params;
      const { requestedDiscountPercent, reason, changeRequests, message } = req.body;
      const data = await this.service.submitNegotiation(
        id,
        {
          requestedDiscountPercent: Number(requestedDiscountPercent),
          reason: String(reason || ''),
          changeRequests: Array.isArray(changeRequests) ? changeRequests : undefined,
          message: message ? String(message) : undefined,
        },
        customerId,
        userEmail,
        userName
      );
      sendSuccess(res, data, 'Counter offer submitted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }

  async confirmQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { id } = req.params;
      const data = await this.service.confirmQuotation(id, customerId, userEmail);
      sendSuccess(res, data, 'Quotation confirmed and order generated successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { search, status, page, limit } = req.query;
      const result = await this.service.listOrders(
        {
          search: typeof search === 'string' ? search : undefined,
          status: typeof status === 'string' ? status : undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
        customerId,
        userEmail
      );
      sendSuccess(
        res,
        result.items,
        'Orders retrieved successfully',
        HttpStatus.OK,
        {
          page: result.page,
          limit: result.limit,
          pageSize: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPreviousPage: result.page > 1,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { id } = req.params;
      const data = await this.service.getOrderById(id, customerId, userEmail);
      sendSuccess(res, data, 'Order details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { search, status, page, limit } = req.query;
      const result = await this.service.listInvoices(
        {
          search: typeof search === 'string' ? search : undefined,
          status: typeof status === 'string' ? status : undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
        customerId,
        userEmail
      );
      sendSuccess(
        res,
        result.items,
        'Invoices retrieved successfully',
        HttpStatus.OK,
        {
          page: result.page,
          limit: result.limit,
          pageSize: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPreviousPage: result.page > 1,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { id } = req.params;
      const data = await this.service.getInvoiceById(id, customerId, userEmail);
      sendSuccess(res, data, 'Invoice details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async payInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { id } = req.params;
      const { amount, paymentMethod } = req.body;
      const data = await this.service.payInvoice(
        id,
        {
          amount: String(amount),
          paymentMethod: paymentMethod || 'NET_BANKING',
        },
        customerId,
        userEmail
      );
      sendSuccess(res, data, 'Payment processed successfully', HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { search, page, limit } = req.query;
      const result = await this.service.listPayments(
        {
          search: typeof search === 'string' ? search : undefined,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
        customerId,
        userEmail
      );
      sendSuccess(
        res,
        result.items,
        'Payments retrieved successfully',
        HttpStatus.OK,
        {
          page: result.page,
          limit: result.limit,
          pageSize: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPreviousPage: result.page > 1,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async listSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const data = await this.service.listSubscriptions(customerId, userEmail);
      sendSuccess(res, data, 'Subscriptions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSubscriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const { id } = req.params;
      const data = await this.service.getSubscriptionById(id, customerId, userEmail);
      sendSuccess(res, data, 'Subscription details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const data = await this.service.listNotifications(customerId, userEmail);
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

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const userName = req.user?.name;
      const data = await this.service.getProfile(customerId, userEmail, userName);
      sendSuccess(res, data, 'Customer profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = this.getCustomerId(req);
      const userEmail = req.user?.email;
      const userName = req.user?.name;
      const data = await this.service.updateProfile(
        {
          ...req.body,
          email: req.body.email || userEmail,
        },
        customerId,
        userEmail,
        userName
      );
      sendSuccess(res, data, 'Customer profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const customerPortalController = new CustomerPortalController();
