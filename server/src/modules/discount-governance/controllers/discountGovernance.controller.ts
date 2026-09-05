import { Response, Request, NextFunction } from 'express';
import { sendSuccess } from '../../../common/utils/index.js';
import { HttpStatus } from '../../../common/constants/httpStatus.js';
import { UnauthorizedError } from '../../../common/errors/index.js';
import { DiscountEvaluationService } from '../services/discountEvaluation.service.js';
import { ApprovalRoutingService } from '../services/approvalRouting.service.js';
import { DiscountGovernanceRepository } from '../repositories/discountGovernance.repository.js';
import {
  submitQuotationSchema,
  approveApprovalSchema,
  rejectApprovalSchema,
  pendingApprovalsQuerySchema,
} from '../validators/discountGovernance.validator.js';
import { Roles } from '../../rbac/constants/roles.js';
import { ApprovalLevels } from '../constants/approvalLevels.js';

export class DiscountGovernanceController {
  private discountEvaluationService: DiscountEvaluationService;
  private approvalRoutingService: ApprovalRoutingService;
  private repository: DiscountGovernanceRepository;

  constructor(
    evaluationService: DiscountEvaluationService = new DiscountEvaluationService(),
    routingService: ApprovalRoutingService = new ApprovalRoutingService(),
    repo: DiscountGovernanceRepository = new DiscountGovernanceRepository()
  ) {
    this.discountEvaluationService = evaluationService;
    this.approvalRoutingService = routingService;
    this.repository = repo;
  }

  /**
   * POST /api/v1/quotations/:id/submit
   * Evaluates quotation discounts and submits for approval if needed.
   */
  public submitQuotation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const quotationId = req.params.id;
      const validatedBody = submitQuotationSchema.parse(req.body);
      const userId = req.user.userId;
      const userRole = req.user.roles[0] || Roles.SALES_REP;

      const result = await this.approvalRoutingService.submitQuotation(
        quotationId,
        userId,
        userRole,
        validatedBody.notes
      );

      sendSuccess(res, result, 'Quotation submitted successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/quotations/:id/evaluate-discount
   * Preview discount evaluation non-destructively.
   */
  public evaluateDiscount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const quotationId = req.params.id;
      const result = await this.discountEvaluationService.evaluateQuotation(quotationId);

      sendSuccess(
        res,
        result,
        'Discount evaluation calculated successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/quotations/:id/discount-evaluation
   * Retrieve discount evaluation audit records for a quotation.
   */
  public getDiscountEvaluation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const quotationId = req.params.id;
      const auditRecords = await this.repository.getDiscountEvaluationsByQuotationId(quotationId);

      if (auditRecords.length > 0) {
        sendSuccess(
          res,
          auditRecords,
          'Quotation discount evaluation records retrieved successfully',
          HttpStatus.OK
        );
        return;
      }

      // If no persisted audit records yet, calculate current evaluation
      const liveEvaluation = await this.discountEvaluationService.evaluateQuotation(quotationId);
      sendSuccess(
        res,
        liveEvaluation,
        'Quotation discount evaluation calculated successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/quotations/:id/approvals
   * Retrieve approval history and status for a quotation.
   */
  public getQuotationApprovals = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const quotationId = req.params.id;
      const approvals = await this.repository.getApprovalsByQuotationId(quotationId);

      sendSuccess(
        res,
        approvals,
        'Quotation approvals retrieved successfully',
        HttpStatus.OK
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/approvals/pending
   * List pending approvals filtered by the authenticated user's role.
   */
  public listPendingApprovals = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const query = pendingApprovalsQuerySchema.parse(req.query);
      const userRoles = req.user.roles;

      let allowedLevels: string[] | undefined = undefined;

      // Filter by user role if not Admin
      if (userRoles.includes(Roles.ADMIN)) {
        allowedLevels = undefined; // see all
      } else if (userRoles.includes(Roles.SALES_MANAGER)) {
        allowedLevels = [ApprovalLevels.MANAGER];
      } else if (userRoles.includes(Roles.FINANCE)) {
        allowedLevels = [ApprovalLevels.FINANCE];
      } else {
        // Sales Reps or other roles cannot view approvals
        allowedLevels = [];
      }

      // If query specifies a level, ensure it intersects with allowed
      if (query.approvalLevel) {
        if (allowedLevels && !allowedLevels.includes(query.approvalLevel)) {
          allowedLevels = [];
        } else {
          allowedLevels = [query.approvalLevel];
        }
      }

      const { items, total } = await this.repository.listPendingApprovals({
        allowedLevels,
        status: query.status,
        page: query.page,
        limit: query.limit,
      });

      const totalPages = Math.ceil(total / query.limit) || 1;

      sendSuccess(
        res,
        items,
        'Pending approvals retrieved successfully',
        HttpStatus.OK,
        {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        }
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/approvals/:id/approve
   * Approve a pending approval step.
   */
  public approveApproval = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const approvalId = req.params.id;
      const validatedBody = approveApprovalSchema.parse(req.body);
      const userId = req.user.userId;
      const userRoles = req.user.roles;

      const result = await this.approvalRoutingService.approveApproval(
        approvalId,
        userId,
        userRoles,
        validatedBody.comments
      );

      sendSuccess(res, result, 'Approval step approved successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/approvals/:id/reject
   * Reject a pending approval step.
   */
  public rejectApproval = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const approvalId = req.params.id;
      const validatedBody = rejectApprovalSchema.parse(req.body);
      const userId = req.user.userId;
      const userRoles = req.user.roles;

      const result = await this.approvalRoutingService.rejectApproval(
        approvalId,
        userId,
        userRoles,
        validatedBody.comments
      );

      sendSuccess(res, result, 'Approval step rejected successfully', HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}
