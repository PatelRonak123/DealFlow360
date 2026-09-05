import { db, Database, DbClient } from '../../../database/db.js';
import {
  quotations,
  quotationItems,
  NewQuotationDiscountEvaluation,
  NewQuotationApproval,
} from '../../../database/schema/index.js';
import { eq } from 'drizzle-orm';
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
      // Invalidate existing pending approvals and clean previous evaluations
      await this.repository.invalidatePendingApprovalsByQuotationId(quotationId, trx);
      await this.repository.deleteDiscountEvaluationsByQuotationId(quotationId, trx);

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

    // Verify associated quotation exists
    const [quotation] = await this.db
      .select()
      .from(quotations)
      .where(eq(quotations.id, approval.quotationId));

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
    const allApprovals = await this.repository.getApprovalsByQuotationId(approval.quotationId);
    const priorIncomplete = allApprovals.find(
      (a) => a.sequence < approval.sequence && a.status !== ApprovalStatuses.APPROVED
    );

    if (priorIncomplete) {
      throw new BadRequestError(
        `Cannot approve level '${approval.approvalLevel}'. Preceding approval step '${priorIncomplete.approvalLevel}' (seq ${priorIncomplete.sequence}) must be approved first.`
      );
    }

    const result = await this.db.transaction(async (trx) => {
      // 1. Update this approval
      const updatedApproval = await this.repository.updateApproval(
        approvalId,
        {
          status: ApprovalStatuses.APPROVED,
          decidedAt: new Date(),
          decidedById: userId,
          comments: comments || null,
        },
        trx
      );

      // 2. Determine next quotation state
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

      await trx
        .update(quotations)
        .set({
          status: nextQuotationStatus,
          updatedAt: new Date(),
        })
        .where(eq(quotations.id, approval.quotationId));

      return {
        approval: updatedApproval,
        quotationStatus: nextQuotationStatus,
        remainingApprovalsCount: remainingPending.length,
      };
    });

    if (result.quotationStatus === QuotationStatuses.APPROVED) {
      // Fully approved
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
      // Escalated to Finance
      notificationsService.emitNotification({
        title: `Finance Review: ${quotation.quotationNumber}`,
        message: `Manager approved. Finance tier-2 margin & profitability review required.`,
        type: 'APPROVAL',
        status: 'PENDING',
        targetRoles: [Roles.FINANCE, Roles.ADMIN],
        linkUrl: '/approvals',
      });
      notificationsService.emitNotification({
        title: `Manager Approved: ${quotation.quotationNumber}`,
        message: `Quotation ${quotation.quotationNumber} approved by Sales Manager and routed to Finance.`,
        type: 'APPROVAL',
        status: 'INFO',
        targetUserId: quotation.createdBy,
        linkUrl: `/quotations/${quotation.id}`,
      });
    }

    quotationsRepository.invalidateCache();
    return result;
  }

  /**
   * Rejects a pending approval step, invalidating subsequent workflow steps.
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

    // Verify associated quotation exists
    const [quotation] = await this.db
      .select()
      .from(quotations)
      .where(eq(quotations.id, approval.quotationId));

    if (!quotation) {
      throw new NotFoundError(`Associated quotation with ID '${approval.quotationId}' was not found`);
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

    const result = await this.db.transaction(async (trx) => {
      // 1. Update this approval to REJECTED
      const updatedApproval = await this.repository.updateApproval(
        approvalId,
        {
          status: ApprovalStatuses.REJECTED,
          decidedAt: new Date(),
          decidedById: userId,
          comments,
        },
        trx
      );

      // 2. Invalidate other pending approvals for this quote
      await this.repository.invalidatePendingApprovalsByQuotationId(approval.quotationId, trx);

      // 3. Set quotation status to REJECTED
      await trx
        .update(quotations)
        .set({
          status: QuotationStatuses.REJECTED,
          updatedAt: new Date(),
        })
        .where(eq(quotations.id, approval.quotationId));

      return {
        approval: updatedApproval,
        quotationStatus: QuotationStatuses.REJECTED,
      };
    });

    notificationsService.emitNotification({
      title: `Quotation ${quotation.quotationNumber} Rejected`,
      message: `Quotation was rejected during governance review: ${comments || 'Discount exceeded governance limits.'}`,
      type: 'REJECTION',
      status: 'REJECTED',
      targetCustomerId: quotation.customerId,
      targetRoles: [Roles.CUSTOMER, Roles.SALES_REP, Roles.ADMIN],
      linkUrl: `/customer/quotations/${quotation.id}`,
    });

    quotationsRepository.invalidateCache();
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
