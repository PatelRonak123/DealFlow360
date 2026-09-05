import { db, Database } from '../../../database/db.js';
import { paymentsRepository, PaymentsRepository, PaymentFilters } from '../repositories/payments.repository.js';
import { invoicesRepository } from '../../invoices/repositories/invoices.repository.js';
import { invoices, payments, NewPayment } from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
import { NotFoundError, BadRequestError } from '../../../common/errors/AppError.js';
import { notificationsService } from '../../notifications/services/notifications.service.js';
import { Roles } from '../../rbac/constants/roles.js';

export interface RecordPaymentDto {
  invoiceId: string;
  amount: number | string;
  paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'UPI';
  transactionReference?: string;
  notes?: string;
}

export class PaymentsService {
  private repository: PaymentsRepository;
  private db: Database;

  constructor(repo: PaymentsRepository = paymentsRepository, databaseClient: Database = db) {
    this.repository = repo;
    this.db = databaseClient;
  }

  async listPayments(filters: PaymentFilters) {
    return this.repository.findPayments(filters);
  }

  async getPaymentById(id: string) {
    const payment = await this.repository.findPaymentById(id);
    if (!payment) {
      throw new NotFoundError(`Payment record '${id}' was not found`);
    }
    return payment;
  }

  async recordPayment(dto: RecordPaymentDto, userId?: string) {
    const payAmount = parseFloat(String(dto.amount));
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new BadRequestError('Payment amount must be greater than 0');
    }

    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.id, dto.invoiceId));
    if (!invoice) {
      throw new NotFoundError(`Invoice '${dto.invoiceId}' was not found`);
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestError('Cannot record payment for a CANCELLED invoice');
    }

    const currentPaid = parseFloat(invoice.amountPaid) || 0;
    const totalAmount = parseFloat(invoice.totalAmount) || 0;
    const currentBalance = parseFloat(invoice.balanceDue) || totalAmount - currentPaid;

    if (currentBalance <= 0 && invoice.status === 'PAID') {
      throw new BadRequestError('Invoice is already fully paid');
    }

    const newPaid = currentPaid + payAmount;
    const newBalance = Math.max(0, totalAmount - newPaid);
    const newStatus = newBalance <= 0.001 ? 'PAID' : 'PARTIALLY_PAID';

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
    const transactionReference = dto.transactionReference?.trim() || `TXN-IN-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const result = await this.db.transaction(async (trx) => {
      const paymentData: NewPayment = {
        paymentNumber,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: payAmount.toFixed(2),
        currency: invoice.currency,
        paymentMethod: dto.paymentMethod,
        transactionReference,
        status: 'COMPLETED',
        notes: dto.notes || null,
        recordedById: userId || null,
        paidAt: new Date(),
      };

      const [createdPayment] = await trx.insert(payments).values(paymentData).returning();

      const [updatedInvoice] = await trx
        .update(invoices)
        .set({
          amountPaid: newPaid.toFixed(2),
          balanceDue: newBalance.toFixed(2),
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id))
        .returning();

      return {
        payment: createdPayment,
        invoice: updatedInvoice,
      };
    });

    notificationsService.emitNotification({
      title: `Payment Received: ₹${payAmount.toLocaleString('en-IN')}`,
      message: `Payment ${paymentNumber} recorded for invoice ${invoice.invoiceNumber}. Remaining balance: ₹${newBalance.toLocaleString('en-IN')}`,
      type: 'PAYMENT',
      status: 'APPROVED',
      targetCustomerId: invoice.customerId,
      targetRoles: [Roles.FINANCE, Roles.ADMIN],
      linkUrl: `/finance/invoices/${invoice.id}`,
    });

    return result;
  }
}

export const paymentsService = new PaymentsService();
