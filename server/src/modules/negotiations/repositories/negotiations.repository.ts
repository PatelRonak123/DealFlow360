import { db } from '../../../database/db.js';
import {
  quotationNegotiations,
  quotations,
  quotationItems,
  customers,
  users,
} from '../../../database/schema/index.js';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { quotationsRepository } from '../../quotations/repositories/quotations.repository.js';
import { AuthUserContext } from '../../rbac/types/index.js';
import { Roles } from '../../rbac/constants/roles.js';

export interface NegotiationListItem {
  id: string;
  quotationId: string;
  quotationNumber: string;
  quotationVersionNumber: number;
  quotationStatus: string;
  quotationSubtotal: string;
  quotationDiscountAmount: string;
  quotationTotalAmount: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  requestedDiscountPercent: number;
  requestedChanges: string[];
  customerMessage: string;
  status: string;
  repResponse?: string;
  revisedQuotationId?: string;
  revisedQuotationNumber?: string;
  revisedQuotationStatus?: string;
  handledByName?: string;
  handledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class NegotiationsRepository {
  async listNegotiations(
    filter: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    user: AuthUserContext
  ): Promise<{ items: NegotiationListItem[]; total: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Number(filter.limit) || 20);
    const offset = (page - 1) * limit;

    const conditions = [];

    // Role filtering: Sales Rep only sees their own assigned/created quotations unless Manager/Admin
    const isManagerOrAdmin =
      user.roles.includes(Roles.ADMIN) ||
      user.roles.includes(Roles.SALES_MANAGER) ||
      user.roles.includes(Roles.FINANCE);

    if (!isManagerOrAdmin) {
      conditions.push(eq(quotations.createdBy, user.userId));
    }

    if (filter.status && filter.status !== 'ALL') {
      conditions.push(eq(quotationNegotiations.status, filter.status));
    }

    if (filter.search && filter.search.trim()) {
      const term = filter.search.trim();
      conditions.push(
        or(
          ilike(quotations.quotationNumber, `%${term}%`),
          ilike(customers.companyName, `%${term}%`),
          ilike(quotationNegotiations.customerMessage, `%${term}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch negotiation rows joined with quotation and customer
    const rows = await db
      .select({
        id: quotationNegotiations.id,
        quotationId: quotationNegotiations.quotationId,
        quotationNumber: quotations.quotationNumber,
        quotationVersionNumber: quotations.versionNumber,
        quotationStatus: quotations.status,
        quotationSubtotal: quotations.subtotal,
        quotationDiscountAmount: quotations.discountAmount,
        quotationTotalAmount: quotations.totalAmount,
        customerId: quotationNegotiations.customerId,
        customerName: customers.companyName,
        customerEmail: customers.email,
        requestedDiscountPercent: quotationNegotiations.requestedDiscountPercent,
        requestedChanges: quotationNegotiations.requestedChanges,
        customerMessage: quotationNegotiations.customerMessage,
        status: quotationNegotiations.status,
        repResponse: quotationNegotiations.repResponse,
        revisedQuotationId: quotationNegotiations.revisedQuotationId,
        handledBy: quotationNegotiations.handledBy,
        handledAt: quotationNegotiations.handledAt,
        createdAt: quotationNegotiations.createdAt,
        updatedAt: quotationNegotiations.updatedAt,
      })
      .from(quotationNegotiations)
      .innerJoin(quotations, eq(quotationNegotiations.quotationId, quotations.id))
      .innerJoin(customers, eq(quotationNegotiations.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(quotationNegotiations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotationNegotiations)
      .innerJoin(quotations, eq(quotationNegotiations.quotationId, quotations.id))
      .innerJoin(customers, eq(quotationNegotiations.customerId, customers.id))
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // Enrich with revised quotation numbers and user names if any
    const enriched: NegotiationListItem[] = await Promise.all(
      rows.map(async (r) => {
        let revisedQuotationNumber: string | undefined = undefined;
        let revisedQuotationStatus: string | undefined = undefined;
        if (r.revisedQuotationId) {
          const rev = await db.query.quotations.findFirst({
            where: eq(quotations.id, r.revisedQuotationId),
          });
          if (rev) {
            revisedQuotationNumber = rev.quotationNumber;
            revisedQuotationStatus = rev.status;
          }
        }

        let handledByName: string | undefined = undefined;
        if (r.handledBy) {
          const u = await db.query.users.findFirst({
            where: eq(users.id, r.handledBy),
          });
          if (u) handledByName = u.name;
        }

        let parsedChanges: string[] = [];
        try {
          if (r.requestedChanges) {
            parsedChanges = JSON.parse(r.requestedChanges);
          }
        } catch {
          parsedChanges = [r.requestedChanges || ''];
        }

        return {
          id: r.id,
          quotationId: r.quotationId,
          quotationNumber: r.quotationNumber,
          quotationVersionNumber: r.quotationVersionNumber,
          quotationStatus: r.quotationStatus,
          quotationSubtotal: r.quotationSubtotal,
          quotationDiscountAmount: r.quotationDiscountAmount,
          quotationTotalAmount: r.quotationTotalAmount,
          customerId: r.customerId,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          requestedDiscountPercent: parseFloat(String(r.requestedDiscountPercent || '0')),
          requestedChanges: parsedChanges,
          customerMessage: r.customerMessage || '',
          status: r.status,
          repResponse: r.repResponse || undefined,
          revisedQuotationId: r.revisedQuotationId || undefined,
          revisedQuotationNumber,
          revisedQuotationStatus,
          handledByName,
          handledAt: r.handledAt ? new Date(r.handledAt).toISOString() : undefined,
          createdAt: new Date(r.createdAt).toISOString(),
          updatedAt: new Date(r.updatedAt).toISOString(),
        };
      })
    );

    return { items: enriched, total };
  }

  async findById(id: string): Promise<any> {
    const row = await db.query.quotationNegotiations.findFirst({
      where: eq(quotationNegotiations.id, id),
      with: {
        // Can resolve quotation and customer separately
      },
    });
    if (!row) return undefined;

    const [quote, customer] = await Promise.all([
      db.query.quotations.findFirst({
        where: eq(quotations.id, row.quotationId),
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      }),
      db.query.customers.findFirst({
        where: eq(customers.id, row.customerId),
      }),
    ]);

    let revisedQuotation = undefined;
    if (row.revisedQuotationId) {
      revisedQuotation = await db.query.quotations.findFirst({
        where: eq(quotations.id, row.revisedQuotationId),
        with: {
          items: true,
        },
      });
    }

    return {
      ...row,
      quotation: quote,
      customer,
      revisedQuotation,
    };
  }

  async declineNegotiation(
    id: string,
    repResponse: string,
    userId: string
  ): Promise<any> {
    const neg = await this.findById(id);
    if (!neg) {
      throw new Error(`Negotiation request with ID '${id}' not found`);
    }

    const [updated] = await db
      .update(quotationNegotiations)
      .set({
        status: 'DECLINED',
        repResponse,
        handledBy: userId,
        handledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotationNegotiations.id, id))
      .returning();

    // Reset quotation status back to APPROVED or SENT, keeping V1 customer-visible
    await db
      .update(quotations)
      .set({
        status: 'APPROVED',
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, neg.quotationId));

    quotationsRepository.invalidateCache();
    return updated;
  }

  async createRevisionFromNegotiation(
    negotiationId: string,
    user: AuthUserContext
  ): Promise<any> {
    const neg = await this.findById(negotiationId);
    if (!neg) {
      throw new Error(`Negotiation with ID '${negotiationId}' not found`);
    }

    const parent = neg.quotation;
    if (!parent) {
      throw new Error(`Original quotation '${neg.quotationId}' not found`);
    }

    const existingItems = await quotationsRepository.findItemsByQuotationId(parent.id);
    if (existingItems.length === 0) {
      throw new Error(`Quotation '${parent.quotationNumber}' contains no line items to revise`);
    }

    const revisionNumber = await quotationsRepository.generateNextRevisionNumber(parent.quotationNumber);
    const today = new Date().toISOString().split('T')[0];
    const expiryDateObj = new Date();
    expiryDateObj.setDate(expiryDateObj.getDate() + 30);
    const expiryDate = expiryDateObj.toISOString().split('T')[0];

    const requestedDiscountPct = parseFloat(String(neg.requestedDiscountPercent || '0'));
    const subtotalNum = parseFloat(parent.subtotal || '0');
    const newDiscountAmountNum = (subtotalNum * requestedDiscountPct) / 100;
    const newTotalAmountNum = subtotalNum - newDiscountAmountNum;

    const revNote = `Revision for Customer Negotiation: ${neg.customerMessage || `${requestedDiscountPct}% requested discount`}`;

    const createdQuotation = await db.transaction(async (tx) => {
      // 1. Insert header for V2: INTERNAL ONLY (isCustomerVisible = false)
      const [insertedHeader] = await tx
        .insert(quotations)
        .values({
          quotationNumber: revisionNumber,
          customerId: parent.customerId,
          priceListId: parent.priceListId,
          status: 'DRAFT',
          currency: parent.currency,
          subtotal: subtotalNum.toFixed(2),
          discountAmount: newDiscountAmountNum.toFixed(2),
          totalAmount: newTotalAmountNum.toFixed(2),
          issueDate: today,
          expiryDate: expiryDate,
          notes: revNote,
          parentQuotationId: parent.id,
          versionNumber: (parent.versionNumber || 1) + 1,
          isCustomerVisible: false, // CRITICAL: Internal revision until Sales Manager approves
          revisionReason: neg.customerMessage || `Negotiated discount of ${requestedDiscountPct}%`,
          negotiationId: neg.id,
          createdBy: user.userId,
        })
        .returning();

      // 2. Clone line items with requested discount applied proportionally
      for (const item of existingItems) {
        const itemUnitPrice = parseFloat(item.unitPrice || '0');
        const itemQty = item.quantity || 1;
        const itemGross = itemUnitPrice * itemQty;
        const itemDiscount = (itemGross * requestedDiscountPct) / 100;
        const itemNet = itemGross - itemDiscount;

        await tx.insert(quotationItems).values({
          quotationId: insertedHeader.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          skuSnapshot: item.skuSnapshot,
          quantity: itemQty,
          unitPrice: itemUnitPrice.toFixed(2),
          discountPercent: requestedDiscountPct.toFixed(2),
          grossAmount: itemGross.toFixed(2),
          discountAmount: itemDiscount.toFixed(2),
          netAmount: itemNet.toFixed(2),
        });
      }

      // 3. Update negotiation record: status = 'REVISION_CREATED', link revisedQuotationId
      await tx
        .update(quotationNegotiations)
        .set({
          status: 'REVISION_CREATED',
          revisedQuotationId: insertedHeader.id,
          handledBy: user.userId,
          handledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(quotationNegotiations.id, neg.id));

      return insertedHeader;
    });

    quotationsRepository.invalidateCache();
    return createdQuotation;
  }
}

export const negotiationsRepository = new NegotiationsRepository();
