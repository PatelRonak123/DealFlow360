import { Request, Response, NextFunction } from 'express';
import { paymentsService, PaymentsService } from '../services/payments.service.js';
import { sendSuccess } from '../../../common/utils/index.js';

export class PaymentsController {
  private service: PaymentsService;

  constructor(serviceInstance: PaymentsService = paymentsService) {
    this.service = serviceInstance;
  }

  async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId, customerId, status, paymentMethod, search, page, limit } = req.query;
      const result = await this.service.listPayments({
        invoiceId: invoiceId as string,
        customerId: customerId as string,
        status: status as string,
        paymentMethod: paymentMethod as string,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });
      sendSuccess(res, result, 'Payments retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await this.service.getPaymentById(id);
      sendSuccess(res, payment, 'Payment retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const result = await this.service.recordPayment(req.body, userId);
      sendSuccess(res, result, 'Payment recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}

export const paymentsController = new PaymentsController();
