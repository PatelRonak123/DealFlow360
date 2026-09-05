import { db, Database, DbClient } from '../../../database/db.js';
import {
  payments,
  invoices,
  customers,
  users,
  Payment,
  NewPayment,
} from '../../../database/schema/index.js';
import { eq, and, or, ilike, desc, count } from 'drizzle-orm';

export interface PaymentFilters {
  invoiceId?: string;
  customerId?: string;
  status?: string;
  paymentMethod?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaymentWithDetails extends Payment {
  customer?: {
    id: string;
    companyName: string;
    email: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    amountPaid: string;
    balanceDue: string;
    status: string;
  };
  recordedByUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export class PaymentsRepository {
  private db: Database;

  constructor(databaseClient: Database = db) {
    this.db = databaseClient;
  }

  async findPayments(
    filters: PaymentFilters = {}
  ): Promise<{ items: PaymentWithDetails[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.invoiceId) {
      conditions.push(eq(payments.invoiceId, filters.invoiceId));
    }

    if (filters.customerId) {
      conditions.push(eq(payments.customerId, filters.customerId));
    }

    if (filters.status && filters.status !== 'ALL') {
      conditions.push(eq(payments.status, filters.status));
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
      conditions.push(eq(payments.paymentMethod, filters.paymentMethod));
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(payments.paymentNumber, term),
          ilike(payments.transactionReference, term),
          ilike(payments.notes, term)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(payments)
      .where(whereClause);

    const total = countResult ? Number(countResult.total) : 0;

    const rows = await this.db
      .select({
        payment: payments,
        invoice: invoices,
        customer: customers,
        recordedByUser: users,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .innerJoin(customers, eq(payments.customerId, customers.id))
      .leftJoin(users, eq(payments.recordedById, users.id))
      .where(whereClause)
      .orderBy(desc(payments.paidAt))
      .limit(limit)
      .offset(offset);

    const items: PaymentWithDetails[] = rows.map((r) => ({
      ...r.payment,
      customer: {
        id: r.customer.id,
        companyName: r.customer.companyName,
        email: r.customer.email,
      },
      invoice: {
        id: r.invoice.id,
        invoiceNumber: r.invoice.invoiceNumber,
        totalAmount: r.invoice.totalAmount,
        amountPaid: r.invoice.amountPaid,
        balanceDue: r.invoice.balanceDue,
        status: r.invoice.status,
      },
      recordedByUser: r.recordedByUser
        ? {
            id: r.recordedByUser.id,
            name: r.recordedByUser.name,
            email: r.recordedByUser.email,
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

  async findPaymentById(id: string): Promise<PaymentWithDetails | null> {
    const [row] = await this.db
      .select({
        payment: payments,
        invoice: invoices,
        customer: customers,
        recordedByUser: users,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .innerJoin(customers, eq(payments.customerId, customers.id))
      .leftJoin(users, eq(payments.recordedById, users.id))
      .where(or(eq(payments.id, id), eq(payments.paymentNumber, id)));

    if (!row) return null;

    return {
      ...row.payment,
      customer: {
        id: row.customer.id,
        companyName: row.customer.companyName,
        email: row.customer.email,
      },
      invoice: {
        id: row.invoice.id,
        invoiceNumber: row.invoice.invoiceNumber,
        totalAmount: row.invoice.totalAmount,
        amountPaid: row.invoice.amountPaid,
        balanceDue: row.invoice.balanceDue,
        status: row.invoice.status,
      },
      recordedByUser: row.recordedByUser
        ? {
            id: row.recordedByUser.id,
            name: row.recordedByUser.name,
            email: row.recordedByUser.email,
          }
        : null,
    };
  }

  async createPayment(paymentData: NewPayment, trx?: DbClient): Promise<Payment> {
    const client = trx || this.db;
    const [created] = await client.insert(payments).values(paymentData).returning();
    return created;
  }
}

export const paymentsRepository = new PaymentsRepository();
