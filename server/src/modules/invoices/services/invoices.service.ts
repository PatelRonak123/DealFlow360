import { db, Database } from '../../../database/db.js';
import { invoicesRepository, InvoicesRepository, InvoiceFilters } from '../repositories/invoices.repository.js';
import { quotations, quotationItems, products } from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
import { NotFoundError, BadRequestError } from '../../../common/errors/AppError.js';
import { notificationsService } from '../../notifications/services/notifications.service.js';
import { Roles } from '../../rbac/constants/roles.js';

export interface CreateInvoiceDto {
  quotationId?: string;
  customerId: string;
  orderNumber?: string;
  dueDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: string | number;
    discountPercent?: string | number;
  }>;
}

export class InvoicesService {
  private repository: InvoicesRepository;
  private db: Database;

  constructor(repo: InvoicesRepository = invoicesRepository, databaseClient: Database = db) {
    this.repository = repo;
    this.db = databaseClient;
  }

  async listInvoices(filters: InvoiceFilters) {
    return this.repository.findInvoices(filters);
  }

  async getInvoiceById(id: string) {
    const invoice = await this.repository.findInvoiceById(id);
    if (!invoice) {
      throw new NotFoundError(`Invoice '${id}' was not found`);
    }
    return invoice;
  }

  async generateInvoiceFromQuotation(quotationId: string, userId?: string) {
    const [quote] = await this.db.select().from(quotations).where(eq(quotations.id, quotationId));
    if (!quote) {
      throw new NotFoundError(`Quotation with ID '${quotationId}' was not found`);
    }

    const items = await this.db.select().from(quotationItems).where(eq(quotationItems.quotationId, quotationId));
    if (items.length === 0) {
      throw new BadRequestError('Quotation contains no line items to invoice');
    }

    const invoiceNumber = `INV-${quote.quotationNumber.replace(/^QT-|^Q-/, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const orderNumber = `ORD-${quote.quotationNumber.replace(/^QT-|^Q-/, '')}`;

    const subtotal = parseFloat(quote.subtotal) || 0;
    const discountAmount = parseFloat(quote.discountAmount) || 0;
    const totalAmount = parseFloat(quote.totalAmount) || 0;
    const taxAmount = parseFloat((totalAmount * 0.18).toFixed(2));
    const finalTotal = parseFloat((totalAmount + taxAmount).toFixed(2));

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const itemsData = items.map((it) => ({
      productId: it.productId,
      productNameSnapshot: it.productNameSnapshot,
      skuSnapshot: it.skuSnapshot,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountPercent: it.discountPercent,
      grossAmount: it.grossAmount,
      discountAmount: it.discountAmount,
      netAmount: it.netAmount,
    }));

    const newInvoice = await this.repository.createInvoice(
      {
        invoiceNumber,
        quotationId: quote.id,
        customerId: quote.customerId,
        orderNumber,
        status: 'ISSUED',
        currency: quote.currency || 'INR',
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: finalTotal.toFixed(2),
        amountPaid: '0.00',
        balanceDue: finalTotal.toFixed(2),
        issueDate,
        dueDate,
        notes: quote.notes,
        createdById: userId || null,
      },
      itemsData
    );

    notificationsService.emitNotification({
      title: `Invoice Generated: ${invoiceNumber}`,
      message: `Tax Invoice ${invoiceNumber} created for ₹${finalTotal.toLocaleString('en-IN')}`,
      type: 'INVOICE',
      status: 'INFO',
      targetCustomerId: quote.customerId,
      targetRoles: [Roles.FINANCE, Roles.ADMIN],
      linkUrl: `/finance/invoices/${newInvoice.id}`,
    });

    return newInvoice;
  }

  async createManualInvoice(dto: CreateInvoiceDto, userId?: string) {
    let subtotalNum = 0;
    let totalDiscountNum = 0;

    const itemsData = await Promise.all(
      dto.items.map(async (item) => {
        const [prod] = await this.db.select().from(products).where(eq(products.id, item.productId));
        const unitPriceNum = parseFloat(String(item.unitPrice)) || 0;
        const discountPct = parseFloat(String(item.discountPercent || 0)) || 0;
        const gross = unitPriceNum * item.quantity;
        const discount = (gross * discountPct) / 100;
        const net = gross - discount;

        subtotalNum += gross;
        totalDiscountNum += discount;

        return {
          productId: item.productId,
          productNameSnapshot: prod?.name || 'Item Product',
          skuSnapshot: prod?.sku || 'SKU-GEN',
          quantity: item.quantity,
          unitPrice: unitPriceNum.toFixed(2),
          discountPercent: discountPct.toFixed(2),
          grossAmount: gross.toFixed(2),
          discountAmount: discount.toFixed(2),
          netAmount: net.toFixed(2),
        };
      })
    );

    const netBeforeTax = subtotalNum - totalDiscountNum;
    const taxNum = parseFloat((netBeforeTax * 0.18).toFixed(2));
    const grandTotal = parseFloat((netBeforeTax + taxNum).toFixed(2));

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = dto.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.repository.createInvoice(
      {
        invoiceNumber,
        quotationId: dto.quotationId || null,
        customerId: dto.customerId,
        orderNumber: dto.orderNumber || null,
        status: 'ISSUED',
        currency: 'INR',
        subtotal: subtotalNum.toFixed(2),
        discountAmount: totalDiscountNum.toFixed(2),
        taxAmount: taxNum.toFixed(2),
        totalAmount: grandTotal.toFixed(2),
        amountPaid: '0.00',
        balanceDue: grandTotal.toFixed(2),
        issueDate,
        dueDate,
        notes: dto.notes || null,
        createdById: userId || null,
      },
      itemsData
    );
  }

  async updateInvoiceStatus(id: string, status: string) {
    const existing = await this.getInvoiceById(id);
    const updated = await this.repository.updateInvoice(existing.id, { status });
    return updated;
  }
}

export const invoicesService = new InvoicesService();
