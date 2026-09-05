import { db, Database } from '../../../database/db.js';
import { financeRepository, FinanceRepository } from '../repositories/finance.repository.js';
import { discountGovernanceRepository, DiscountGovernanceRepository } from '../../discount-governance/repositories/discountGovernance.repository.js';
import { approvalRoutingService, ApprovalRoutingService } from '../../discount-governance/services/approvalRouting.service.js';
import {
  quotations,
  quotationItems,
  quotationApprovals,
  quotationDiscountEvaluations,
  customers,
  customerTiers,
  products,
  users,
} from '../../../database/schema/index.js';
import { eq, or, desc } from 'drizzle-orm';
import { NotFoundError, BadRequestError } from '../../../common/errors/AppError.js';
import { notificationsService } from '../../notifications/services/notifications.service.js';

export class FinanceService {
  private repository: FinanceRepository;
  private governanceRepo: DiscountGovernanceRepository;
  private approvalService: ApprovalRoutingService;
  private db: Database;

  constructor(
    repo: FinanceRepository = financeRepository,
    govRepo: DiscountGovernanceRepository = discountGovernanceRepository,
    apprService: ApprovalRoutingService = approvalRoutingService,
    databaseClient: Database = db
  ) {
    this.repository = repo;
    this.governanceRepo = govRepo;
    this.approvalService = apprService;
    this.db = databaseClient;
  }

  async getDashboardOverview() {
    return this.repository.getDashboardMetrics();
  }

  async listFinanceApprovals(filters: { status?: string; page?: number; limit?: number }) {
    return this.governanceRepo.listPendingApprovals({
      allowedLevels: ['FINANCE'],
      status: filters.status || 'PENDING',
      page: filters.page || 1,
      limit: filters.limit || 20,
    });
  }

  async getFinancialDealReview(id: string) {
    // 1. Find approval record or quotation by ID
    const [approvalRow] = await this.db
      .select()
      .from(quotationApprovals)
      .where(or(eq(quotationApprovals.id, id), eq(quotationApprovals.quotationId, id)));

    const quotationId = approvalRow ? approvalRow.quotationId : id;

    const [quote] = await this.db
      .select({
        quotation: quotations,
        customer: customers,
        customerTier: customerTiers,
        createdBy: users,
      })
      .from(quotations)
      .innerJoin(customers, eq(quotations.customerId, customers.id))
      .leftJoin(customerTiers, eq(customers.customerTierId, customerTiers.id))
      .leftJoin(users, eq(quotations.createdBy, users.id))
      .where(or(eq(quotations.id, quotationId), eq(quotations.quotationNumber, quotationId)));

    if (!quote) {
      throw new NotFoundError(`Quotation with ID '${quotationId}' was not found`);
    }

    // 2. Fetch line items with product details
    const rawItems = await this.db
      .select({
        item: quotationItems,
        product: products,
      })
      .from(quotationItems)
      .innerJoin(products, eq(quotationItems.productId, products.id))
      .where(eq(quotationItems.quotationId, quote.quotation.id));

    // 3. Fetch discount evaluations and approval steps
    const [evaluations, approvalsList] = await Promise.all([
      this.db
        .select()
        .from(quotationDiscountEvaluations)
        .where(eq(quotationDiscountEvaluations.quotationId, quote.quotation.id)),
      this.db
        .select({
          approval: quotationApprovals,
          decidedByUser: users,
        })
        .from(quotationApprovals)
        .leftJoin(users, eq(quotationApprovals.decidedById, users.id))
        .where(eq(quotationApprovals.quotationId, quote.quotation.id))
        .orderBy(quotationApprovals.sequence),
    ]);

    // 4. Compute financial margin metrics
    // Baseline unit cost estimate is 60-70% of standard list price for commercial margin audit
    let totalGrossRevenue = 0;
    let totalDiscountGiven = 0;
    let totalNetRevenue = 0;
    let totalEstimatedCost = 0;

    const lineItemsWithFinancials = rawItems.map((r) => {
      const it = r.item;
      const unitPrice = parseFloat(it.unitPrice) || 0;
      const discountPct = parseFloat(it.discountPercent) || 0;
      const gross = parseFloat(it.grossAmount) || unitPrice * it.quantity;
      const discount = parseFloat(it.discountAmount) || (gross * discountPct) / 100;
      const net = parseFloat(it.netAmount) || gross - discount;

      // Estimated cost baseline: ~65% of original unit price
      const estimatedUnitCost = unitPrice * 0.65;
      const estimatedTotalCost = estimatedUnitCost * it.quantity;
      const grossProfit = net - estimatedTotalCost;
      const marginPercent = net > 0 ? (grossProfit / net) * 100 : 0;

      totalGrossRevenue += gross;
      totalDiscountGiven += discount;
      totalNetRevenue += net;
      totalEstimatedCost += estimatedTotalCost;

      const evalMatch = evaluations.find((e) => e.quotationItemId === it.id);

      return {
        id: it.id,
        productId: it.productId,
        productName: r.product.name,
        sku: r.product.sku,
        category: r.product.productType || 'Enterprise Product',
        quantity: it.quantity,
        unitPrice: unitPrice.toFixed(2),
        discountPercent: discountPct.toFixed(2),
        grossAmount: gross.toFixed(2),
        discountAmount: discount.toFixed(2),
        netAmount: net.toFixed(2),
        estimatedUnitCost: estimatedUnitCost.toFixed(2),
        estimatedTotalCost: estimatedTotalCost.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        marginPercent: marginPercent.toFixed(1),
        evaluation: evalMatch
          ? {
              effectiveAllowedDiscount: evalMatch.effectiveAllowedDiscount,
              excessDiscount: evalMatch.excessDiscount,
              isViolation: evalMatch.isViolation,
              riskContribution: evalMatch.riskContribution,
            }
          : null,
      };
    });

    const totalGrossProfit = totalNetRevenue - totalEstimatedCost;
    const overallMarginPercent = totalNetRevenue > 0 ? (totalGrossProfit / totalNetRevenue) * 100 : 0;
    const overallDiscountPercent = totalGrossRevenue > 0 ? (totalDiscountGiven / totalGrossRevenue) * 100 : 0;

    const totalRiskScore = evaluations.reduce((sum, e) => sum + (parseFloat(e.riskContribution) || 0), 0);
    const violationCount = evaluations.filter((e) => e.isViolation).length;

    return {
      approvalId: approvalRow ? approvalRow.id : undefined,
      currentApprovalLevel: approvalRow ? approvalRow.approvalLevel : 'FINANCE',
      approvalStatus: approvalRow ? approvalRow.status : 'PENDING',
      quotation: {
        id: quote.quotation.id,
        quotationNumber: quote.quotation.quotationNumber,
        status: quote.quotation.status,
        currency: quote.quotation.currency,
        subtotal: quote.quotation.subtotal,
        discountAmount: quote.quotation.discountAmount,
        totalAmount: quote.quotation.totalAmount,
        issueDate: quote.quotation.issueDate,
        expiryDate: quote.quotation.expiryDate,
        notes: quote.quotation.notes,
        createdAt: quote.quotation.createdAt,
      },
      customer: {
        id: quote.customer.id,
        companyName: quote.customer.companyName,
        contactName: quote.customer.contactName,
        email: quote.customer.email,
        phone: quote.customer.phone,
        tierName: quote.customerTier?.name || 'Standard Tier',
        defaultDiscountLimit: quote.customerTier?.description || '10% Max Standard Discount',
      },
      createdBy: {
        id: quote.createdBy?.id,
        name: quote.createdBy?.name || 'Sales Representative',
        email: quote.createdBy?.email,
      },
      financialSummary: {
        totalGrossRevenue: totalGrossRevenue.toFixed(2),
        totalDiscountGiven: totalDiscountGiven.toFixed(2),
        overallDiscountPercent: overallDiscountPercent.toFixed(1),
        totalNetRevenue: totalNetRevenue.toFixed(2),
        totalEstimatedCost: totalEstimatedCost.toFixed(2),
        totalGrossProfit: totalGrossProfit.toFixed(2),
        overallMarginPercent: overallMarginPercent.toFixed(1),
        totalRiskScore: totalRiskScore.toFixed(2),
        violationCount,
        marginFloorCompliant: overallMarginPercent >= 20.0,
      },
      lineItems: lineItemsWithFinancials,
      approvalHistory: approvalsList.map((a) => ({
        id: a.approval.id,
        approvalLevel: a.approval.approvalLevel,
        status: a.approval.status,
        sequence: a.approval.sequence,
        requestedAt: a.approval.requestedAt,
        decidedAt: a.approval.decidedAt,
        comments: a.approval.comments,
        decidedBy: a.decidedByUser
          ? {
              id: a.decidedByUser.id,
              name: a.decidedByUser.name,
              email: a.decidedByUser.email,
            }
          : null,
      })),
    };
  }

  async approveDeal(approvalId: string, userId: string, userRole: string | string[], comments?: string) {
    return this.approvalService.approveApproval(approvalId, userId, userRole, comments);
  }

  async rejectDeal(approvalId: string, userId: string, userRole: string | string[], comments: string) {
    return this.approvalService.rejectApproval(approvalId, userId, userRole, comments);
  }

  async returnDealForRevision(
    approvalId: string,
    userId: string,
    userRole: string | string[],
    comments: string
  ) {
    if (!comments || comments.trim().length < 3) {
      throw new BadRequestError('Revision feedback comments must be at least 3 characters');
    }
    // Rejection with return comments and status notification to rep
    const result = await this.approvalService.rejectApproval(
      approvalId,
      userId,
      userRole,
      `Returned for Revision: ${comments}`
    );

    return {
      ...result,
      action: 'RETURNED_FOR_REVISION',
    };
  }
}

export const financeService = new FinanceService();
