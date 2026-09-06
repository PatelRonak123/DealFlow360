import { db, Database } from "../../../database/db.js";
import {
  invoices,
  payments,
  quotationApprovals,
  quotations,
  customers,
  users,
  subscriptionPlans,
} from "../../../database/schema/index.js";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { invoicesRepository } from "../../invoices/repositories/invoices.repository.js";

export interface FinanceDashboardMetrics {
  overview: {
    pendingFinanceApprovals: number;
    pendingFinanceValue: number;
    approvedDealsCount: number;
    rejectedDealsCount: number;
    approvedAwaitingInvoiceCount: number;
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    overdueAmount: number;
    pendingInvoicesCount: number;
    paidInvoicesCount: number;
    overdueInvoicesCount: number;
    activeSubscriptionPlans: number;
  };
  arAging: {
    current: number; // < 30 days
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  recentInvoices: any[];
  recentPayments: any[];
  recentApprovals: any[];
  approvedQuotationsAwaitingInvoice: any[];
}

export class FinanceRepository {
  private db: Database;

  constructor(databaseClient: Database = db) {
    this.db = databaseClient;
  }

  async getDashboardMetrics(): Promise<FinanceDashboardMetrics> {
    // 1. Invoices summary
    const invoiceSummary = await invoicesRepository.countInvoicesSummary();

    // 2. Pending Finance Approvals
    const [financeApprovalsResult] = await this.db
      .select({
        count: count(),
        totalValue: sql<string>`COALESCE(SUM(${quotations.totalAmount}), 0)`,
      })
      .from(quotationApprovals)
      .innerJoin(quotations, eq(quotationApprovals.quotationId, quotations.id))
      .where(
        and(
          eq(quotationApprovals.approvalLevel, "FINANCE"),
          eq(quotationApprovals.status, "PENDING"),
        ),
      );

    // 3. Approved & Rejected this month
    const [decisionsResult] = await this.db
      .select({
        approvedCount: sql<string>`COALESCE(COUNT(*) FILTER (WHERE status = 'APPROVED'), 0)`,
        rejectedCount: sql<string>`COALESCE(COUNT(*) FILTER (WHERE status = 'REJECTED'), 0)`,
      })
      .from(quotationApprovals)
      .where(eq(quotationApprovals.approvalLevel, "FINANCE"));

    // 4. Active Subscription Plans
    const [activePlansResult] = await this.db
      .select({
        count: count(),
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true));

    // 5. AR Aging Breakdown from invoices
    const [agingResult] = await this.db
      .select({
        current: sql<string>`COALESCE(SUM(CASE WHEN due_date >= CURRENT_DATE THEN balance_due ELSE 0 END), 0)`,
        days31to60: sql<string>`COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND due_date >= CURRENT_DATE - INTERVAL '30 days' THEN balance_due ELSE 0 END), 0)`,
        days61to90: sql<string>`COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE - INTERVAL '30 days' AND due_date >= CURRENT_DATE - INTERVAL '60 days' THEN balance_due ELSE 0 END), 0)`,
        over90: sql<string>`COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE - INTERVAL '60 days' THEN balance_due ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(inArray(invoices.status, ["ISSUED", "PARTIALLY_PAID", "OVERDUE"]));

    // 6. Recent Invoices
    const recentInvoicesRows = await this.db
      .select({
        invoice: invoices,
        customer: customers,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.createdAt))
      .limit(5);

    // 7. Recent Payments
    const recentPaymentsRows = await this.db
      .select({
        payment: payments,
        invoice: invoices,
        customer: customers,
      })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .innerJoin(customers, eq(payments.customerId, customers.id))
      .orderBy(desc(payments.paidAt))
      .limit(5);

    // 8. Recent Finance Approvals
    const recentApprovalsRows = await this.db
      .select({
        approval: quotationApprovals,
        quotation: quotations,
        customer: customers,
        decidedByUser: users,
      })
      .from(quotationApprovals)
      .innerJoin(quotations, eq(quotationApprovals.quotationId, quotations.id))
      .leftJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(users, eq(quotationApprovals.decidedById, users.id))
      .where(eq(quotationApprovals.approvalLevel, "FINANCE"))
      .orderBy(desc(quotationApprovals.updatedAt))
      .limit(5);

    // 9. Approved Quotations Awaiting Invoicing
    const approvedAwaitingRows = await this.db
      .select({
        quotation: quotations,
        customer: customers,
        invoice: invoices,
      })
      .from(quotations)
      .innerJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(invoices, eq(quotations.id, invoices.quotationId))
      .where(eq(quotations.status, "APPROVED"))
      .orderBy(desc(quotations.updatedAt));

    const uninvoicedApprovedQuotes = approvedAwaitingRows.filter(
      (r) => r.invoice === null,
    );

    return {
      overview: {
        pendingFinanceApprovals: Number(financeApprovalsResult?.count || 0),
        pendingFinanceValue: parseFloat(
          financeApprovalsResult?.totalValue || "0",
        ),
        approvedDealsCount: Number(decisionsResult?.approvedCount || 0),
        rejectedDealsCount: Number(decisionsResult?.rejectedCount || 0),
        approvedAwaitingInvoiceCount: uninvoicedApprovedQuotes.length,
        totalInvoiced: invoiceSummary.totalInvoiced,
        totalCollected: invoiceSummary.totalCollected,
        totalOutstanding: invoiceSummary.totalOutstanding,
        overdueAmount:
          parseFloat(agingResult?.days31to60 || "0") +
          parseFloat(agingResult?.days61to90 || "0") +
          parseFloat(agingResult?.over90 || "0"),
        pendingInvoicesCount: invoiceSummary.pendingCount,
        paidInvoicesCount: invoiceSummary.paidCount,
        overdueInvoicesCount: invoiceSummary.overdueCount,
        activeSubscriptionPlans: Number(activePlansResult?.count || 0),
      },
      arAging: {
        current: parseFloat(agingResult?.current || "0"),
        days31to60: parseFloat(agingResult?.days31to60 || "0"),
        days61to90: parseFloat(agingResult?.days61to90 || "0"),
        over90: parseFloat(agingResult?.over90 || "0"),
      },
      recentInvoices: recentInvoicesRows.map((r) => ({
        ...r.invoice,
        customer: r.customer,
      })),
      recentPayments: recentPaymentsRows.map((r) => ({
        ...r.payment,
        invoiceNumber: r.invoice.invoiceNumber,
        customer: r.customer,
      })),
      recentApprovals: recentApprovalsRows.map((r) => ({
        ...r.approval,
        quotation: r.quotation,
        customer: r.customer,
        decidedByUser: r.decidedByUser,
      })),
      approvedQuotationsAwaitingInvoice: uninvoicedApprovedQuotes
        .slice(0, 5)
        .map((r) => ({
          ...r.quotation,
          customer: r.customer,
          hasInvoice: false,
        })),
    };
  }

  async listApprovedQuotations(filters?: {
    search?: string;
    invoiced?: boolean;
  }) {
    const rows = await this.db
      .select({
        quotation: quotations,
        customer: customers,
        invoice: invoices,
      })
      .from(quotations)
      .innerJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(invoices, eq(quotations.id, invoices.quotationId))
      .where(eq(quotations.status, "APPROVED"))
      .orderBy(desc(quotations.updatedAt));

    let filtered = rows;
    if (filters?.invoiced !== undefined) {
      if (filters.invoiced) {
        filtered = filtered.filter((r) => r.invoice !== null);
      } else {
        filtered = filtered.filter((r) => r.invoice === null);
      }
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.quotation.quotationNumber.toLowerCase().includes(q) ||
          r.customer.companyName.toLowerCase().includes(q),
      );
    }

    return filtered.map((r) => ({
      ...r.quotation,
      customer: r.customer,
      hasInvoice: Boolean(r.invoice),
      invoice: r.invoice
        ? {
            id: r.invoice.id,
            invoiceNumber: r.invoice.invoiceNumber,
            status: r.invoice.status,
            totalAmount: r.invoice.totalAmount,
            balanceDue: r.invoice.balanceDue,
          }
        : null,
    }));
  }
}

export const financeRepository = new FinanceRepository();
