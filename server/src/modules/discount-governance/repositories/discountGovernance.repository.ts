import { db, Database, DbClient } from '../../../database/db.js';
import {
  quotationApprovals,
  quotationDiscountEvaluations,
  quotations,
  customers,
  users,
  QuotationApproval,
  NewQuotationApproval,
  QuotationDiscountEvaluation,
  NewQuotationDiscountEvaluation,
} from '../../../database/schema/index.js';
import { eq, and, desc, inArray, count } from 'drizzle-orm';
import { ApprovalStatuses } from '../constants/approvalStatus.js';

export interface PendingApprovalListItem extends QuotationApproval {
  quotation?: {
    id: string;
    quotationNumber: string;
    subtotal: string;
    discountAmount: string;
    totalAmount: string;
    discountPercent?: string;
    status: string;
    notes?: string | null;
    currency: string;
    customerId: string;
    createdById: string;
    customer?: {
      id: string;
      companyName: string;
      email: string;
    };
    createdBy?: {
      id: string;
      name: string;
      email: string;
    };
  };
  decidedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CachedPendingApprovals {
  data: { items: PendingApprovalListItem[]; total: number };
  expiresAt: number;
}

const pendingApprovalsCache = new Map<string, CachedPendingApprovals>();
const inFlightPendingApprovals = new Map<string, Promise<{ items: PendingApprovalListItem[]; total: number }>>();
const PENDING_CACHE_TTL_MS = 15 * 1000; // 15 seconds fast cache

export class DiscountGovernanceRepository {
  private db: Database;

  constructor(databaseClient: Database = db) {
    this.db = databaseClient;
  }

  invalidateCache(): void {
    pendingApprovalsCache.clear();
  }

  async getDiscountEvaluationsByQuotationId(
    quotationId: string,
    trx?: DbClient
  ): Promise<QuotationDiscountEvaluation[]> {
    const client = trx || this.db;
    return client
      .select()
      .from(quotationDiscountEvaluations)
      .where(eq(quotationDiscountEvaluations.quotationId, quotationId))
      .orderBy(quotationDiscountEvaluations.createdAt);
  }

  async deleteDiscountEvaluationsByQuotationId(
    quotationId: string,
    trx?: DbClient
  ): Promise<void> {
    const client = trx || this.db;
    await client
      .delete(quotationDiscountEvaluations)
      .where(eq(quotationDiscountEvaluations.quotationId, quotationId));
  }

  async createDiscountEvaluations(
    evaluations: NewQuotationDiscountEvaluation[],
    trx?: DbClient
  ): Promise<QuotationDiscountEvaluation[]> {
    if (evaluations.length === 0) return [];
    const client = trx || this.db;
    return client.insert(quotationDiscountEvaluations).values(evaluations).returning();
  }

  async getApprovalsByQuotationId(
    quotationId: string,
    trx?: DbClient
  ): Promise<QuotationApproval[]> {
    const client = trx || this.db;
    return client
      .select()
      .from(quotationApprovals)
      .where(eq(quotationApprovals.quotationId, quotationId))
      .orderBy(quotationApprovals.sequence);
  }

  async getApprovalById(
    approvalId: string,
    trx?: DbClient
  ): Promise<QuotationApproval | null> {
    const client = trx || this.db;
    const [result] = await client
      .select()
      .from(quotationApprovals)
      .where(eq(quotationApprovals.id, approvalId));
    return result || null;
  }

  async createApprovals(
    approvalsData: NewQuotationApproval[],
    trx?: DbClient
  ): Promise<QuotationApproval[]> {
    if (approvalsData.length === 0) return [];
    const client = trx || this.db;
    const created = await client.insert(quotationApprovals).values(approvalsData).returning();
    this.invalidateCache();
    return created;
  }

  async updateApproval(
    approvalId: string,
    updateData: Partial<NewQuotationApproval>,
    trx?: DbClient
  ): Promise<QuotationApproval | null> {
    const client = trx || this.db;
    const [updated] = await client
      .update(quotationApprovals)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(quotationApprovals.id, approvalId))
      .returning();
    this.invalidateCache();
    return updated || null;
  }

  async invalidatePendingApprovalsByQuotationId(
    quotationId: string,
    trx?: DbClient
  ): Promise<void> {
    const client = trx || this.db;
    await client
      .update(quotationApprovals)
      .set({
        status: ApprovalStatuses.INVALIDATED,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(quotationApprovals.quotationId, quotationId),
          eq(quotationApprovals.status, ApprovalStatuses.PENDING)
        )
      );
    this.invalidateCache();
  }

  async listPendingApprovals(filters: {
    allowedLevels?: string[];
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ items: PendingApprovalListItem[]; total: number }> {
    const cacheKey = JSON.stringify(filters);
    const cached = pendingApprovalsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    if (inFlightPendingApprovals.has(cacheKey)) {
      return inFlightPendingApprovals.get(cacheKey)!;
    }

    const fetchPromise = (async () => {
      try {
        const offset = (filters.page - 1) * filters.limit;
        const conditions = [];

        if (filters.status) {
          conditions.push(eq(quotationApprovals.status, filters.status));
        }

        if (filters.allowedLevels && filters.allowedLevels.length > 0) {
          conditions.push(inArray(quotationApprovals.approvalLevel, filters.allowedLevels));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Run Count query and Rows query in parallel to eliminate sequential network round trips
        const countQuery = this.db
          .select({ total: count() })
          .from(quotationApprovals)
          .where(whereClause);

        const rowsQuery = this.db
          .select({
            approval: quotationApprovals,
            quotation: quotations,
            customer: customers,
            createdBy: users,
          })
          .from(quotationApprovals)
          .innerJoin(quotations, eq(quotationApprovals.quotationId, quotations.id))
          .leftJoin(customers, eq(quotations.customerId, customers.id))
          .leftJoin(users, eq(quotations.createdBy, users.id))
          .where(whereClause)
          .orderBy(desc(quotationApprovals.requestedAt))
          .limit(filters.limit)
          .offset(offset);

        const [[countResult], rows] = await Promise.all([countQuery, rowsQuery]);

        const total = countResult ? Number(countResult.total) : 0;

        const items: PendingApprovalListItem[] = rows.map((row) => {
          const subtotalNum = Number(row.quotation.subtotal) || 0;
          const discountAmountNum = Number(row.quotation.discountAmount) || 0;
          const discountPercent = subtotalNum > 0
            ? ((discountAmountNum / subtotalNum) * 100).toFixed(1)
            : '0.0';

          return {
            ...row.approval,
            quotation: {
              id: row.quotation.id,
              quotationNumber: row.quotation.quotationNumber,
              subtotal: row.quotation.subtotal,
              discountAmount: row.quotation.discountAmount,
              totalAmount: row.quotation.totalAmount,
              discountPercent,
              status: row.quotation.status,
              notes: row.quotation.notes,
              currency: row.quotation.currency,
              customerId: row.quotation.customerId,
              createdById: row.quotation.createdBy,
              customer: row.customer
                ? {
                    id: row.customer.id,
                    companyName: row.customer.companyName,
                    email: row.customer.email,
                  }
                : undefined,
              createdBy: row.createdBy
                ? {
                    id: row.createdBy.id,
                    name: row.createdBy.name,
                    email: row.createdBy.email,
                  }
                : undefined,
            },
          };
        });

        const result = { items, total };
        pendingApprovalsCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + PENDING_CACHE_TTL_MS,
        });

        return result;
      } finally {
        inFlightPendingApprovals.delete(cacheKey);
      }
    })();

    inFlightPendingApprovals.set(cacheKey, fetchPromise);
    return fetchPromise;
  }
}

export const discountGovernanceRepository = new DiscountGovernanceRepository();
