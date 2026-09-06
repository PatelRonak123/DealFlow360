import {
  negotiationsRepository,
  NegotiationsRepository,
  NegotiationListItem,
} from '../repositories/negotiations.repository.js';
import { AuthUserContext } from '../../rbac/types/index.js';
import { NotFoundError, BadRequestError } from '../../../common/errors/index.js';
import { notificationsService } from '../../notifications/services/notifications.service.js';
import { Roles } from '../../rbac/constants/roles.js';

export class NegotiationsService {
  constructor(private readonly repository: NegotiationsRepository = negotiationsRepository) {}

  async listNegotiations(
    filter: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    user: AuthUserContext
  ): Promise<{ items: NegotiationListItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Number(filter.limit) || 20);
    const { items, total } = await this.repository.listNegotiations(filter, user);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getNegotiationById(id: string, user: AuthUserContext): Promise<any> {
    const neg = await this.repository.findById(id);
    if (!neg) {
      throw new NotFoundError(`Negotiation with ID '${id}' not found`);
    }

    const isManagerOrAdmin =
      user.roles.includes(Roles.ADMIN) ||
      user.roles.includes(Roles.SALES_MANAGER) ||
      user.roles.includes(Roles.FINANCE);

    if (!isManagerOrAdmin && neg.quotation?.createdBy !== user.userId) {
      throw new BadRequestError('Access denied to this negotiation record');
    }

    return neg;
  }

  async declineNegotiation(
    id: string,
    repResponse: string,
    user: AuthUserContext
  ): Promise<any> {
    if (!repResponse || repResponse.trim().length < 3) {
      throw new BadRequestError('A response explanation of at least 3 characters is required to decline');
    }

    const neg = await this.getNegotiationById(id, user);
    if (neg.status === 'DECLINED' || neg.status === 'APPROVED') {
      throw new BadRequestError(`Negotiation is already '${neg.status}' and cannot be declined`);
    }

    const updated = await this.repository.declineNegotiation(id, repResponse.trim(), user.userId);

    // Notify customer that negotiation was declined, and original quote remains active
    notificationsService.emitNotification({
      title: `Negotiation Response: ${neg.quotation?.quotationNumber || 'Quotation'}`,
      message: `Your Sales Representative responded to your counter-offer: "${repResponse.trim()}". The original quotation terms remain active for your acceptance.`,
      type: 'NEGOTIATION',
      status: 'INFO',
      targetCustomerId: neg.customerId,
      targetRoles: [Roles.CUSTOMER],
      linkUrl: `/customer/quotations/${neg.quotationId}`,
    });

    return updated;
  }

  async createRevisionFromNegotiation(
    negotiationId: string,
    user: AuthUserContext
  ): Promise<any> {
    const neg = await this.getNegotiationById(negotiationId, user);
    if (neg.status === 'DECLINED') {
      throw new BadRequestError('Cannot create revision for a declined negotiation request');
    }

    const revision = await this.repository.createRevisionFromNegotiation(negotiationId, user);

    // Notify Sales Manager that a revised quotation has been drafted
    notificationsService.emitNotification({
      title: `Revision Created: ${revision.quotationNumber}`,
      message: `Sales Representative created revision ${revision.quotationNumber} based on customer negotiation (${neg.requestedDiscountPercent}% discount).`,
      type: 'QUOTATION',
      status: 'INFO',
      targetRoles: [Roles.SALES_MANAGER, Roles.ADMIN],
      linkUrl: `/quotations/${revision.id}`,
    });

    return revision;
  }
}

export const negotiationsService = new NegotiationsService();
