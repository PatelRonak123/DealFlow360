import { Request, Response, NextFunction } from 'express';
import { invoicesService, InvoicesService } from '../services/invoices.service.js';
import { sendSuccess } from '../../../common/utils/index.js';

export class InvoicesController {
  private service: InvoicesService;

  constructor(serviceInstance: InvoicesService = invoicesService) {
    this.service = serviceInstance;
  }

  async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, customerId, search, page, limit } = req.query;
      const result = await this.service.listInvoices({
        status: status as string,
        customerId: customerId as string,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });
      sendSuccess(res, result, 'Invoices retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await this.service.getInvoiceById(id);
      sendSuccess(res, invoice, 'Invoice retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async generateFromQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quotationId } = req.body;
      const userId = (req as any).user?.id;
      const invoice = await this.service.generateInvoiceFromQuotation(quotationId, userId);
      sendSuccess(res, invoice, 'Invoice generated from quotation successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async createManualInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const invoice = await this.service.createManualInvoice(req.body, userId);
      sendSuccess(res, invoice, 'Invoice created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await this.service.updateInvoiceStatus(id, status);
      sendSuccess(res, updated, 'Invoice status updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const invoicesController = new InvoicesController();
