import { db, Database, DbClient } from '../../../database/db.js';
import {
  invoices,
  invoiceItems,
  payments,
  customers,
  quotations,
  users,
  Invoice,
  NewInvoice,
  InvoiceItem,
  NewInvoiceItem,
} from '../../../database/schema/index.js';
import { eq, and, or, ilike, desc, sql, count } from 'drizzle-orm';

export interface InvoiceFilters {
  status?: string;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceWithDetails extends Invoice {
  customer?: {
    id: string;
    companyName: string;
    email: string;
    contactName?: string | null;
    phone?: string | null;
  };
  quotation?: {
    id: string;
    quotationNumber: string;
    totalAmount: string;
  } | null;
  items?: InvoiceItem[];
  payments?: any[];
}

export class InvoicesRepository {
  private db: Database;

  constructor(databaseClient: Database = db) {
    this.db = databaseClient;
  }

  async findInvoices(
    filters: InvoiceFilters = {}
  ): Promise<{ items: InvoiceWithDetails[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.status && filters.status !== 'ALL') {
      conditions.push(eq(invoices.status, filters.status));
    }

    if (filters.customerId) {
      conditions.push(eq(invoices.customerId, filters.customerId));
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, term),
          ilike(invoices.orderNumber, term),
          ilike(invoices.notes, term)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(invoices)
      .where(whereClause);

    const total = countResult ? Number(countResult.total) : 0;

    const rows = await this.db
      .select({
        invoice: invoices,
        customer: customers,
        quotation: quotations,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(quotations, eq(invoices.quotationId, quotations.id))
      .where(whereClause)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const items: InvoiceWithDetails[] = rows.map((r) => ({
      ...r.invoice,
      customer: {
        id: r.customer.id,
        companyName: r.customer.companyName,
        email: r.customer.email,
        contactName: r.customer.contactName,
        phone: r.customer.phone,
      },
      quotation: r.quotation
        ? {
            id: r.quotation.id,
            quotationNumber: r.quotation.quotationNumber,
            totalAmount: r.quotation.totalAmount,
          }
        : null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findInvoiceById(id: string): Promise<InvoiceWithDetails | null> {
    const [invoiceRow] = await this.db
      .select({
        invoice: invoices,
        customer: customers,
        quotation: quotations,
        createdByUser: users,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(quotations, eq(invoices.quotationId, quotations.id))
      .leftJoin(users, eq(invoices.createdById, users.id))
      .where(or(eq(invoices.id, id), eq(invoices.invoiceNumber, id)));

    if (!invoiceRow) return null;

    const [itemsList, paymentsList] = await Promise.all([
      this.db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceRow.invoice.id)),
      this.db
        .select()
        .from(payments)
        .where(eq(payments.invoiceId, invoiceRow.invoice.id))
        .orderBy(desc(payments.paidAt)),
    ]);

    return {
      ...invoiceRow.invoice,
      customer: {
        id: invoiceRow.customer.id,
        companyName: invoiceRow.customer.companyName,
        email: invoiceRow.customer.email,
        contactName: invoiceRow.customer.contactName,
        phone: invoiceRow.customer.phone,
      },
      quotation: invoiceRow.quotation
        ? {
            id: invoiceRow.quotation.id,
            quotationNumber: invoiceRow.quotation.quotationNumber,
            totalAmount: invoiceRow.quotation.totalAmount,
          }
        : null,
      items: itemsList,
      payments: paymentsList,
    };
  }

  async createInvoice(
    invoiceData: NewInvoice,
    itemsData: Omit<NewInvoiceItem, 'invoiceId'>[],
    trx?: DbClient
  ): Promise<InvoiceWithDetails> {
    const client = trx || this.db;

    const [createdInvoice] = await client.insert(invoices).values(invoiceData).returning();

    let createdItems: InvoiceItem[] = [];
    if (itemsData.length > 0) {
      const itemsToInsert: NewInvoiceItem[] = itemsData.map((item) => ({
        ...item,
        invoiceId: createdInvoice.id,
      }));
      createdItems = await client.insert(invoiceItems).values(itemsToInsert).returning();
    }

    return {
      ...createdInvoice,
      items: createdItems,
      payments: [],
    };
  }

  async updateInvoice(
    id: string,
    updateData: Partial<NewInvoice>,
    trx?: DbClient
  ): Promise<Invoice | null> {
    const client = trx || this.db;
    const [updated] = await client
      .update(invoices)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    return updated || null;
  }

  async countInvoicesSummary(): Promise<{
    totalCount: number;
    pendingCount: number;
    paidCount: number;
    overdueCount: number;
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
  }> {
    const [result] = await this.db
      .select({
        totalCount: count(),
        totalInvoiced: sql<string>`COALESCE(SUM(total_amount), 0)`,
        totalCollected: sql<string>`COALESCE(SUM(amount_paid), 0)`,
        totalOutstanding: sql<string>`COALESCE(SUM(balance_due), 0)`,
        pendingCount: sql<string>`COALESCE(COUNT(*) FILTER (WHERE status IN ('ISSUED', 'PARTIALLY_PAID')), 0)`,
        paidCount: sql<string>`COALESCE(COUNT(*) FILTER (WHERE status = 'PAID'), 0)`,
        overdueCount: sql<string>`COALESCE(COUNT(*) FILTER (WHERE status = 'OVERDUE' OR (status IN ('ISSUED', 'PARTIALLY_PAID') AND due_date < CURRENT_DATE)), 0)`,
      })
      .from(invoices);

    return {
      totalCount: Number(result?.totalCount || 0),
      totalInvoiced: parseFloat(result?.totalInvoiced || '0'),
      totalCollected: parseFloat(result?.totalCollected || '0'),
      totalOutstanding: parseFloat(result?.totalOutstanding || '0'),
      pendingCount: Number(result?.pendingCount || 0),
      paidCount: Number(result?.paidCount || 0),
      overdueCount: Number(result?.overdueCount || 0),
    };
  }
}

export const invoicesRepository = new InvoicesRepository();
