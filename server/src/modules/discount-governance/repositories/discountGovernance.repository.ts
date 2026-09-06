import { db, Database, DbClient } from '../../../database/db.js';
import {
  quotationApprovals,
  quotationDiscountEvaluations,
  quotations,
  quotationNegotiations,
  customers,
  users,
  QuotationApproval,
  NewQuotationApproval,
  QuotationDiscountEvaluation,
  NewQuotationDiscountEvaluation,
} from '../../../database/schema/index.js';
import { eq, and, or, desc, inArray, count } from 'drizzle-orm';
import { ApprovalStatuses } from '../constants/approvalStatus.js';
import { QuotationStatuses } from '../../quotations/constants/quotationStatus.js';

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
    versionNumber?: number;
    parentQuotationId?: string | null;
    revisionReason?: string | null;
    isRevision?: boolean;
    parentQuotation?: {
      id: string;
      quotationNumber: string;
      subtotal: string;
      discountAmount: string;
      totalAmount: string;
    };
    negotiation?: {
      id: string;
      requestedDiscountPercent: number;
      customerMessage?: string;
      requestedChanges?: string[];
    };
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
    trx?: DbClient,
    comments?: string
  ): Promise<void> {
    const client = trx || this.db;
    const updatePayload: Record<string, any> = {
      status: ApprovalStatuses.INVALIDATED,
      updatedAt: new Date(),
    };
    if (comments) {
      updatePayload.comments = comments;
    }
    await client
      .update(quotationApprovals)
      .set(updatePayload)
      .where(
        and(
          eq(quotationApprovals.quotationId, quotationId),
          eq(quotationApprovals.status, ApprovalStatuses.PENDING)
        )
      );
    this.invalidateCache();
  }

  /**
   * Automatically discovers any quotations with PENDING_APPROVAL, PENDING_MANAGER_APPROVAL,
   * or PENDING_FINANCE_APPROVAL status that lack an active pending approval record in
   * quotation_approvals (e.g. counter-offers from customer portal or direct submissions),
   * and creates the corresponding approval steps so they appear in governance queues.
   */
  async syncOrphanedPendingQuotations(): Promise<void> {
    try {
      const pendingQuotes = await this.db
        .select({
          id: quotations.id,
          quotationNumber: quotations.quotationNumber,
          status: quotations.status,
          subtotal: quotations.subtotal,
          discountAmount: quotations.discountAmount,
          notes: quotations.notes,
        })
        .from(quotations)
        .where(
          or(
            eq(quotations.status, QuotationStatuses.PENDING_APPROVAL),
            eq(quotations.status, QuotationStatuses.PENDING_MANAGER_APPROVAL),
            eq(quotations.status, QuotationStatuses.PENDING_FINANCE_APPROVAL)
          )
        );

      if (pendingQuotes.length === 0) return;

      const activeApprovals = await this.db
        .select({ quotationId: quotationApprovals.quotationId })
        .from(quotationApprovals)
        .where(eq(quotationApprovals.status, ApprovalStatuses.PENDING));

      const activeQuoteIds = new Set(activeApprovals.map((a) => a.quotationId));
      const orphanedQuotes = pendingQuotes.filter((q) => !activeQuoteIds.has(q.id));

      if (orphanedQuotes.length === 0) return;

      const newApprovals: NewQuotationApproval[] = [];

      for (const q of orphanedQuotes) {
        const subtotalNum = parseFloat(q.subtotal) || 0;
        const discountAmountNum = parseFloat(q.discountAmount) || 0;
        const discountPercent = subtotalNum > 0 ? (discountAmountNum / subtotalNum) * 100 : 0;

        if (q.status === QuotationStatuses.PENDING_FINANCE_APPROVAL) {
          newApprovals.push({
            quotationId: q.id,
            approvalLevel: 'FINANCE',
            status: ApprovalStatuses.PENDING,
            sequence: 2,
            comments: q.notes || 'Quotation discount pending Finance review.',
            requestedAt: new Date(),
          });
        } else if (discountPercent > 20) {
          // Tier 1 Manager + Tier 2 Finance
          newApprovals.push(
            {
              quotationId: q.id,
              approvalLevel: 'MANAGER',
              status: ApprovalStatuses.PENDING,
              sequence: 1,
              comments: q.notes || `Discount requested (${discountPercent.toFixed(1)}% > 20% limit) - Requires Sales Manager & Finance approval.`,
              requestedAt: new Date(),
            },
            {
              quotationId: q.id,
              approvalLevel: 'FINANCE',
              status: ApprovalStatuses.PENDING,
              sequence: 2,
              comments: 'Tier 2 Financial Margin & Profitability Review Required (>20%).',
              requestedAt: new Date(),
            }
          );
        } else {
          // Standard Manager approval
          newApprovals.push({
            quotationId: q.id,
            approvalLevel: 'MANAGER',
            status: ApprovalStatuses.PENDING,
            sequence: 1,
            comments: q.notes || `Discount requested (${discountPercent.toFixed(1)}%).`,
            requestedAt: new Date(),
          });
        }
      }

      if (newApprovals.length > 0) {
        await this.db.insert(quotationApprovals).values(newApprovals);
      }
    } catch (err) {
      console.error('[DiscountGovernanceRepository] Failed to sync orphaned pending quotations:', err);
    }
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
        // Ensure all quotations in pending state have corresponding pending approvals
        await this.syncOrphanedPendingQuotations();

        const offset = (filters.page - 1) * filters.limit;
        const conditions = [];

        if (filters.status) {
          conditions.push(eq(quotationApprovals.status, filters.status));
        }

        if (filters.allowedLevels && filters.allowedLevels.length > 0) {
          conditions.push(inArray(quotationApprovals.approvalLevel, filters.allowedLevels));
        }

        // Sequential multi-layer visibility constraint:
        // 1. Manager-level queue only sees quotations currently in PENDING_APPROVAL or PENDING_MANAGER_APPROVAL.
        // 2. Finance-level queue only sees quotations in PENDING_FINANCE_APPROVAL (Stage 1 Manager must be approved first).
        // If Manager rejects at Stage 1, quotation is REJECTED and Finance will never see it.
        if (!filters.status || filters.status === ApprovalStatuses.PENDING) {
          if (filters.allowedLevels && filters.allowedLevels.length === 1) {
            const level = filters.allowedLevels[0];
            if (level === 'MANAGER') {
              conditions.push(
                or(
                  eq(quotations.status, QuotationStatuses.PENDING_APPROVAL),
                  eq(quotations.status, QuotationStatuses.PENDING_MANAGER_APPROVAL)
                )
              );
            } else if (level === 'FINANCE') {
              conditions.push(
                eq(quotations.status, QuotationStatuses.PENDING_FINANCE_APPROVAL)
              );
            }
          } else {
            // Multi-level / Admin queue
            conditions.push(
              or(
                and(
                  eq(quotationApprovals.approvalLevel, 'MANAGER'),
                  or(
                    eq(quotations.status, QuotationStatuses.PENDING_APPROVAL),
                    eq(quotations.status, QuotationStatuses.PENDING_MANAGER_APPROVAL)
                  )
                ),
                and(
                  eq(quotationApprovals.approvalLevel, 'FINANCE'),
                  eq(quotations.status, QuotationStatuses.PENDING_FINANCE_APPROVAL)
                )
              )
            );
          }
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Run Count query and Rows query in parallel to eliminate sequential network round trips
        const countQuery = this.db
          .select({ total: count() })
          .from(quotationApprovals)
          .innerJoin(quotations, eq(quotationApprovals.quotationId, quotations.id))
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

        const items: PendingApprovalListItem[] = await Promise.all(
          rows.map(async (row) => {
            const subtotalNum = Number(row.quotation.subtotal) || 0;
            const discountAmountNum = Number(row.quotation.discountAmount) || 0;
            const discountPercent = subtotalNum > 0
              ? ((discountAmountNum / subtotalNum) * 100).toFixed(1)
              : '0.0';

            let parentQuotation = undefined;
            if (row.quotation.parentQuotationId) {
              const p = await this.db.query.quotations.findFirst({
                where: eq(quotations.id, row.quotation.parentQuotationId),
              });
              if (p) {
                parentQuotation = {
                  id: p.id,
                  quotationNumber: p.quotationNumber,
                  subtotal: p.subtotal,
                  discountAmount: p.discountAmount,
                  totalAmount: p.totalAmount,
                };
              }
            }

            let negotiation = undefined;
            if (row.quotation.negotiationId) {
              const n = await this.db.query.quotationNegotiations.findFirst({
                where: eq(quotationNegotiations.id, row.quotation.negotiationId),
              });
              if (n) {
                let changes: string[] = [];
                try {
                  if (n.requestedChanges) changes = JSON.parse(n.requestedChanges);
                } catch {
                  changes = [n.requestedChanges || ''];
                }
                negotiation = {
                  id: n.id,
                  requestedDiscountPercent: parseFloat(String(n.requestedDiscountPercent || '0')),
                  customerMessage: n.customerMessage || undefined,
                  requestedChanges: changes,
                };
              }
            }

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
                versionNumber: row.quotation.versionNumber || 1,
                parentQuotationId: row.quotation.parentQuotationId || undefined,
                revisionReason: row.quotation.revisionReason || undefined,
                isRevision: !!row.quotation.parentQuotationId,
                parentQuotation,
                negotiation,
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
          })
        );

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
