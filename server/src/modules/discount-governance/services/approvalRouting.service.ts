import { db, Database, DbClient } from '../../../database/db.js';
import {
  quotations,
  quotationItems,
  quotationNegotiations,
  NewQuotationDiscountEvaluation,
  NewQuotationApproval,
} from '../../../database/schema/index.js';
import { eq, or } from 'drizzle-orm';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../../common/errors/AppError.js';
import { Roles } from '../../rbac/constants/roles.js';
import { QuotationStatuses } from '../../quotations/constants/quotationStatus.js';
import { ApprovalLevels } from '../constants/approvalLevels.js';
import { ApprovalStatuses } from '../constants/approvalStatus.js';
import { ApprovalRoutes } from '../constants/thresholds.js';
import {
  DiscountEvaluationService,
  QuotationDiscountEvaluationResult,
} from './discountEvaluation.service.js';
import { DiscountGovernanceRepository } from '../repositories/discountGovernance.repository.js';
import { quotationsRepository } from '../../quotations/repositories/quotations.repository.js';
import { notificationsService } from '../../notifications/services/notifications.service.js';
import { customerPortalRepository } from '../../customer-portal/repositories/customerPortal.repository.js';

export interface QuotationSubmissionResult {
  quotationId: string;
  quotationNumber: string;
  status: string;
  riskScore: number;
  totalViolations: number;
  approvalRequired: boolean;
  approvalRoute: string;
  evaluation: QuotationDiscountEvaluationResult;
  approvals: Array<{
    id: string;
    approvalLevel: string;
    status: string;
    sequence: number;
  }>;
}

export class ApprovalRoutingService {
  private db: Database;
  private discountEvaluationService: DiscountEvaluationService;
  private repository: DiscountGovernanceRepository;

  constructor(
    databaseClient: Database = db,
    evaluationService: DiscountEvaluationService = new DiscountEvaluationService(databaseClient),
    repo: DiscountGovernanceRepository = new DiscountGovernanceRepository(databaseClient)
  ) {
    this.db = databaseClient;
    this.discountEvaluationService = evaluationService;
    this.repository = repo;
  }

  /**
   * Evaluates quotation discounts and executes the submission workflow.
   * Creates audit evaluations and sets up approval steps if required.
   */
  public async submitQuotation(
    quotationId: string,
    userId: string,
    userRole: string,
    notes?: string
  ): Promise<QuotationSubmissionResult> {
    // 1. Fetch quotation
    const [quotation] = await this.db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId));

    if (!quotation) {
      throw new NotFoundError(`Quotation with ID '${quotationId}' was not found`);
    }

    // 2. Ownership verification for Sales Reps
    if (userRole === Roles.SALES_REP && quotation.createdBy !== userId) {
      throw new ForbiddenError('You can only submit your own draft quotations');
    }

    // 3. Status check - quotation can be submitted if in DRAFT or REJECTED or pending
    const submittableStatuses: string[] = [
      QuotationStatuses.DRAFT,
      QuotationStatuses.REJECTED,
      QuotationStatuses.PENDING_APPROVAL,
      QuotationStatuses.PENDING_MANAGER_APPROVAL,
      QuotationStatuses.PENDING_FINANCE_APPROVAL,
    ];
    if (!submittableStatuses.includes(quotation.status)) {
      throw new BadRequestError(
        `Quotation in '${quotation.status}' status cannot be submitted. Only DRAFT, REJECTED, or PENDING quotations may be submitted.`
      );
    }

    // 4. Line item count check
    const items = await this.db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId));

    if (items.length === 0) {
      throw new BadRequestError('Cannot submit quotation with no line items');
    }

    // 5. Run Discount Evaluation Engine
    const evaluation = await this.discountEvaluationService.evaluateQuotation(quotationId);

    // 6. Execute workflow creation transactionally
    const result = await this.db.transaction(async (trx) => {
      // Invalidate existing pending approvals and clean previous evaluations concurrently
      await Promise.all([
        this.repository.invalidatePendingApprovalsByQuotationId(quotationId, trx),
        this.repository.deleteDiscountEvaluationsByQuotationId(quotationId, trx),
      ]);

      // Persist line-level audit evaluations
      const evaluationRecords: NewQuotationDiscountEvaluation[] = evaluation.lineEvaluations.map(
        (line) => ({
          quotationId,
          quotationItemId: line.quotationItemId,
          appliedDiscount: line.appliedDiscount.toFixed(2),
          customerTierLimit: line.customerTierLimit.toFixed(2),
          categoryLimit: line.categoryLimit.toFixed(2),
          effectiveAllowedDiscount: line.effectiveAllowedDiscount.toFixed(2),
          excessDiscount: line.excessDiscount.toFixed(2),
          isViolation: line.isViolation,
          riskContribution: line.riskContribution.toFixed(2),
        })
      );

      await this.repository.createDiscountEvaluations(evaluationRecords, trx);

      let targetStatus: string = QuotationStatuses.APPROVED;
      const createdApprovals: Array<{
        id: string;
        approvalLevel: string;
        status: string;
        sequence: number;
      }> = [];

      if (evaluation.approvalRoute === ApprovalRoutes.NO_APPROVAL) {
        // Automatically approved
        targetStatus = QuotationStatuses.APPROVED;
      } else if (evaluation.approvalRoute === ApprovalRoutes.MANAGER) {
        targetStatus = QuotationStatuses.PENDING_APPROVAL;
        const approvalsData: NewQuotationApproval[] = [
          {
            quotationId,
            approvalLevel: ApprovalLevels.MANAGER,
            status: ApprovalStatuses.PENDING,
            sequence: 1,
            comments: notes || null,
          },
        ];
        const saved = await this.repository.createApprovals(approvalsData, trx);
        createdApprovals.push(
          ...saved.map((a) => ({
            id: a.id,
            approvalLevel: a.approvalLevel,
            status: a.status,
            sequence: a.sequence,
          }))
        );
      } else if (evaluation.approvalRoute === ApprovalRoutes.MANAGER_AND_FINANCE) {
        targetStatus = QuotationStatuses.PENDING_APPROVAL;
        const approvalsData: NewQuotationApproval[] = [
          {
            quotationId,
            approvalLevel: ApprovalLevels.MANAGER,
            status: ApprovalStatuses.PENDING,
            sequence: 1,
            comments: notes || null,
          },
          {
            quotationId,
            approvalLevel: ApprovalLevels.FINANCE,
            status: ApprovalStatuses.PENDING,
            sequence: 2,
            comments: notes || null,
          },
        ];
        const saved = await this.repository.createApprovals(approvalsData, trx);
        createdApprovals.push(
          ...saved.map((a) => ({
            id: a.id,
            approvalLevel: a.approvalLevel,
            status: a.status,
            sequence: a.sequence,
          }))
        );
      }

      // Update quotation header status
      await trx
        .update(quotations)
        .set({
          status: targetStatus,
          updatedAt: new Date(),
        })
        .where(eq(quotations.id, quotationId));

      return {
        quotationId,
        quotationNumber: quotation.quotationNumber,
        status: targetStatus,
        riskScore: evaluation.riskScore,
        totalViolations: evaluation.totalViolations,
        approvalRequired: evaluation.approvalRequired,
        approvalRoute: evaluation.approvalRoute,
        evaluation,
        approvals: createdApprovals,
      };
    });

    if (result.approvalRequired) {
      notificationsService.emitNotification({
        title: `Approval Required: ${result.quotationNumber}`,
        message: `Quotation ${result.quotationNumber} requires discount governance review (${result.approvalRoute}).`,
        type: 'APPROVAL',
        status: 'PENDING',
        targetRoles: [Roles.SALES_MANAGER, Roles.ADMIN],
        linkUrl: '/approvals',
      });
    }

    notificationsService.emitNotification({
      title: `Quotation ${result.quotationNumber} Submitted`,
      message: `Quotation ${result.quotationNumber} has been submitted for governance review.`,
      type: 'QUOTATION',
      status: 'PENDING',
      targetUserId: userId,
      linkUrl: `/quotations/${result.quotationId}`,
    });

    quotationsRepository.invalidateCache();
    return result;
  }

  /**
   * Approves a pending approval step with role authorization and sequential stage progression.
   */
  public async approveApproval(
    approvalId: string,
    userId: string,
    userRole: string | string[],
    comments?: string
  ) {
    const approval = await this.repository.getApprovalById(approvalId);
    if (!approval) {
      throw new NotFoundError(`Approval record with ID '${approvalId}' was not found`);
    }

    if (approval.status !== ApprovalStatuses.PENDING) {
      throw new BadRequestError(`Approval is already in '${approval.status}' state`);
    }

    // Verify associated quotation exists and fetch all approvals for quotation concurrently
    const [[quotation], allApprovals] = await Promise.all([
      this.db
        .select()
        .from(quotations)
        .where(eq(quotations.id, approval.quotationId)),
      this.repository.getApprovalsByQuotationId(approval.quotationId),
    ]);

    if (!quotation) {
      throw new NotFoundError(`Associated quotation with ID '${approval.quotationId}' was not found`);
    }

    // Role-based authorization: support string or array of roles
    const userRoleList = Array.isArray(userRole) ? userRole : [userRole];
    const isOnlyRep = userRoleList.includes(Roles.SALES_REP) &&
      !userRoleList.includes(Roles.ADMIN) &&
      !userRoleList.includes(Roles.SALES_MANAGER) &&
      !userRoleList.includes(Roles.FINANCE);

    if (isOnlyRep) {
      throw new ForbiddenError('Sales Representatives are not authorized to approve quotations');
    }

    if (approval.approvalLevel === ApprovalLevels.MANAGER) {
      if (!userRoleList.includes(Roles.ADMIN) && !userRoleList.includes(Roles.SALES_MANAGER)) {
        throw new ForbiddenError('Only Sales Managers or Administrators can approve Manager-level approvals');
      }
    } else if (approval.approvalLevel === ApprovalLevels.FINANCE) {
      if (!userRoleList.includes(Roles.ADMIN) && !userRoleList.includes(Roles.FINANCE)) {
        throw new ForbiddenError('Only Finance officers or Administrators can approve Finance-level approvals');
      }
    }

    // Sequential verification: If sequence > 1, all preceding approvals must be APPROVED
    const priorIncomplete = allApprovals.find(
      (a) => a.sequence < approval.sequence && a.status !== ApprovalStatuses.APPROVED
    );

    if (priorIncomplete) {
      throw new BadRequestError(
        `Cannot approve level '${approval.approvalLevel}'. Preceding approval step '${priorIncomplete.approvalLevel}' (seq ${priorIncomplete.sequence}) must be approved first.`
      );
    }

    // Determine next quotation state
    const remainingPending = allApprovals
      .filter((a) => a.id !== approvalId && a.status === ApprovalStatuses.PENDING)
      .sort((a, b) => a.sequence - b.sequence);

    let nextQuotationStatus: string = QuotationStatuses.APPROVED;

    if (remainingPending.length > 0) {
      const nextStep = remainingPending[0];
      if (nextStep.approvalLevel === ApprovalLevels.FINANCE) {
        nextQuotationStatus = QuotationStatuses.PENDING_FINANCE_APPROVAL;
      } else {
        nextQuotationStatus = QuotationStatuses.PENDING_APPROVAL;
      }
    }

    const result = await this.db.transaction(async (trx) => {
      // If advancing to Finance, update timestamp on the Finance step
      if (nextQuotationStatus === QuotationStatuses.PENDING_FINANCE_APPROVAL) {
        const nextFinanceStep = remainingPending.find((a) => a.approvalLevel === ApprovalLevels.FINANCE);
        if (nextFinanceStep) {
          await this.repository.updateApproval(
            nextFinanceStep.id,
            { requestedAt: new Date() },
            trx
          );
        }
      }

      // Concurrently update approval and quotation status inside the transaction
      const [updatedApproval] = await Promise.all([
        this.repository.updateApproval(
          approvalId,
          {
            status: ApprovalStatuses.APPROVED,
            decidedAt: new Date(),
            decidedById: userId,
            comments: comments || null,
          },
          trx
        ),
        trx
          .update(quotations)
          .set({
            status: nextQuotationStatus,
            updatedAt: new Date(),
          })
          .where(eq(quotations.id, approval.quotationId)),
      ]);

      // Atomic customer visibility assignment upon full approval
      if (nextQuotationStatus === QuotationStatuses.APPROVED) {
        if (quotation.parentQuotationId) {
          // 1. Demote previous version(s) from customer-visible
          await trx
            .update(quotations)
            .set({
              isCustomerVisible: false,
              updatedAt: new Date(),
            })
            .where(
              or(
                eq(quotations.id, quotation.parentQuotationId),
                eq(quotations.parentQuotationId, quotation.parentQuotationId)
              )
            );

          // 2. Promote revised quotation V2 to customer-visible
          await trx
            .update(quotations)
            .set({
              isCustomerVisible: true,
              status: QuotationStatuses.APPROVED,
              updatedAt: new Date(),
            })
            .where(eq(quotations.id, quotation.id));

          // 3. Mark linked negotiation as APPROVED
          if (quotation.negotiationId) {
            await trx
              .update(quotationNegotiations)
              .set({
                status: 'APPROVED',
                repResponse: comments || 'Approved by Sales Governance',
                updatedAt: new Date(),
              })
              .where(eq(quotationNegotiations.id, quotation.negotiationId));
          }
        } else {
          // Original quote approved -> ensure customer-visible
          await trx
            .update(quotations)
            .set({
              isCustomerVisible: true,
              updatedAt: new Date(),
            })
            .where(eq(quotations.id, quotation.id));
        }
      }

      return {
        approval: updatedApproval,
        quotationStatus: nextQuotationStatus,
        remainingApprovalsCount: remainingPending.length,
      };
    });

    if (result.quotationStatus === QuotationStatuses.APPROVED) {
      // Fully approved across all layers
      customerPortalRepository.updateNegotiationStatus(approval.quotationId, 'APPROVED', comments);
      customerPortalRepository.invalidateCustomerCache();

      notificationsService.emitNotification({
        title: `Quotation ${quotation.quotationNumber} Approved`,
        message: `Quotation has been approved by Sales Governance. Ready for customer acceptance.`,
        type: 'APPROVAL',
        status: 'APPROVED',
        targetCustomerId: quotation.customerId,
        targetRoles: [Roles.CUSTOMER, Roles.SALES_REP, Roles.ADMIN],
        linkUrl: `/customer/quotations/${quotation.id}`,
      });
    } else if (result.quotationStatus === QuotationStatuses.PENDING_FINANCE_APPROVAL) {
      // Stage 1 (Manager) accepted -> advancing to Stage 2 (Finance)
      notificationsService.emitNotification({
        title: `Finance Review Required: ${quotation.quotationNumber}`,
        message: `Sales Manager approved discount. Tier-2 financial margin & profitability review required.`,
        type: 'APPROVAL',
        status: 'PENDING',
        targetRoles: [Roles.FINANCE, Roles.ADMIN],
        linkUrl: '/finance/approvals',
      });
      notificationsService.emitNotification({
        title: `Manager Approved: ${quotation.quotationNumber}`,
        message: `Quotation ${quotation.quotationNumber} approved by Sales Manager and routed to Finance for final sign-off.`,
        type: 'APPROVAL',
        status: 'INFO',
        targetUserId: quotation.createdBy,
        linkUrl: `/quotations/${quotation.id}`,
      });
    }

    quotationsRepository.invalidateCache();
    this.repository.invalidateCache();
    return result;
  }

  /**
   * Rejects a pending approval step.
   * If Manager rejects at Stage 1: Finance approval is completely skipped (no second approval needed)
   * and the quotation returns to origination.
   * If Finance rejects at Stage 2: Quotation returns to origination without further approvals.
   */
  public async rejectApproval(
    approvalId: string,
    userId: string,
    userRole: string | string[],
    comments: string
  ) {
    const approval = await this.repository.getApprovalById(approvalId);
    if (!approval) {
      throw new NotFoundError(`Approval record with ID '${approvalId}' was not found`);
    }

    if (approval.status !== ApprovalStatuses.PENDING) {
      throw new BadRequestError(`Approval is already in '${approval.status}' state`);
    }

    // Role-based authorization
    const userRoleList = Array.isArray(userRole) ? userRole : [userRole];
    const isOnlyRep = userRoleList.includes(Roles.SALES_REP) &&
      !userRoleList.includes(Roles.ADMIN) &&
      !userRoleList.includes(Roles.SALES_MANAGER) &&
      !userRoleList.includes(Roles.FINANCE);

    if (isOnlyRep) {
      throw new ForbiddenError('Sales Representatives are not authorized to reject quotation approvals');
    }

    if (approval.approvalLevel === ApprovalLevels.MANAGER) {
      if (!userRoleList.includes(Roles.ADMIN) && !userRoleList.includes(Roles.SALES_MANAGER)) {
        throw new ForbiddenError('Only Sales Managers or Administrators can reject Manager-level approvals');
      }
    } else if (approval.approvalLevel === ApprovalLevels.FINANCE) {
      if (!userRoleList.includes(Roles.ADMIN) && !userRoleList.includes(Roles.FINANCE)) {
        throw new ForbiddenError('Only Finance officers or Administrators can reject Finance-level approvals');
      }
    }

    // Verify associated quotation exists
    const [quotation] = await this.db
      .select()
      .from(quotations)
      .where(eq(quotations.id, approval.quotationId));

    if (!quotation) {
      throw new NotFoundError(`Associated quotation with ID '${approval.quotationId}' was not found`);
    }

    const invalidationReason = approval.approvalLevel === ApprovalLevels.MANAGER
      ? 'Approval not required - Rejected by Sales Manager at Stage 1'
      : 'Approval invalidated after Finance rejection';

    const result = await this.db.transaction(async (trx) => {
      // Calculate origination baseline from quotation line items
      const lineItems = await trx
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, approval.quotationId));

      let origSubtotal = parseFloat(quotation.subtotal) || 0;
      let origDiscount = 0;
      let origTotal = origSubtotal;

      if (lineItems.length > 0) {
        origSubtotal = lineItems.reduce(
          (sum, it) => sum + (parseFloat(it.grossAmount) || ((parseFloat(it.unitPrice) || 0) * (it.quantity || 1))),
          0
        );
        origDiscount = lineItems.reduce(
          (sum, it) => sum + (parseFloat(it.discountAmount) || 0),
          0
        );
        origTotal = lineItems.reduce(
          (sum, it) => sum + (parseFloat(it.netAmount) || 0),
          0
        );
      }

      // Concurrently execute approval update, sibling invalidations, and revert quotation to origination
      const [updatedApproval] = await Promise.all([
        this.repository.updateApproval(
          approvalId,
          {
            status: ApprovalStatuses.REJECTED,
            decidedAt: new Date(),
            decidedById: userId,
            comments,
          },
          trx
        ),
        this.repository.invalidatePendingApprovalsByQuotationId(approval.quotationId, trx, invalidationReason),
        trx
          .update(quotations)
          .set({
            status: QuotationStatuses.REJECTED,
            isCustomerVisible: false,
            subtotal: origSubtotal.toFixed(2),
            discountAmount: origDiscount.toFixed(2),
            totalAmount: origTotal.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(quotations.id, approval.quotationId)),
      ]);

      return {
        approval: updatedApproval,
        quotationStatus: QuotationStatuses.REJECTED,
      };
    });

    // Update customer negotiation history entry and invalidate customer cache
    customerPortalRepository.updateNegotiationStatus(approval.quotationId, 'REJECTED', comments);
    customerPortalRepository.invalidateCustomerCache();

    const rejectedByRole = approval.approvalLevel === ApprovalLevels.MANAGER ? 'Sales Manager' : 'Finance';

    if (quotation.parentQuotationId) {
      // Internal revision rejected: Notify Sales Rep, Customer still sees V1
      notificationsService.emitNotification({
        title: `Revision ${quotation.quotationNumber} Rejected by ${rejectedByRole}`,
        message: `Revision ${quotation.quotationNumber} was rejected: ${comments || 'Discount exceeded governance limits.'}. The customer continues to see the current active quotation.`,
        type: 'REJECTION',
        status: 'REJECTED',
        targetUserId: quotation.createdBy,
        targetRoles: [Roles.SALES_REP, Roles.ADMIN],
        linkUrl: `/quotations/${quotation.id}`,
      });
    } else {
      notificationsService.emitNotification({
        title: `Quotation ${quotation.quotationNumber} Rejected by ${rejectedByRole}`,
        message: `Quotation was rejected by ${rejectedByRole}: ${comments || 'Discount exceeded governance limits.'}. Returned to origination without requiring further approval.`,
        type: 'REJECTION',
        status: 'REJECTED',
        targetCustomerId: quotation.customerId,
        targetRoles: [Roles.CUSTOMER, Roles.SALES_REP, Roles.ADMIN],
        linkUrl: `/customer/quotations/${quotation.id}`,
      });
    }

    quotationsRepository.invalidateCache();
    this.repository.invalidateCache();
    return result;
  }

  /**
   * Invalidates existing active approvals and resets quotation to DRAFT if commercial lines change.
   */
  public async invalidateWorkflowOnQuotationMutation(
    quotationId: string,
    trx?: DbClient
  ): Promise<void> {
    const client = trx || this.db;
    const [quotation] = await client
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId));

    if (!quotation) return;

    // If quotation was in an approval workflow state or approved/rejected, revert to DRAFT
    const affectedStatuses: string[] = [
      QuotationStatuses.PENDING_APPROVAL,
      QuotationStatuses.PENDING_MANAGER_APPROVAL,
      QuotationStatuses.PENDING_FINANCE_APPROVAL,
      QuotationStatuses.APPROVED,
      QuotationStatuses.REJECTED,
    ];

    if (affectedStatuses.includes(quotation.status)) {
      await this.repository.invalidatePendingApprovalsByQuotationId(quotationId, trx);
      await client
        .update(quotations)
        .set({
          status: QuotationStatuses.DRAFT,
          updatedAt: new Date(),
        })
        .where(eq(quotations.id, quotationId));
      
      quotationsRepository.invalidateCache();
    }
  }
}

export const approvalRoutingService = new ApprovalRoutingService();
