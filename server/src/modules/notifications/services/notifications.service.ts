import { db } from '../../../database/db.js';
import { customers, quotations, quotationApprovals } from '../../../database/schema/index.js';
import { eq, desc, inArray } from 'drizzle-orm';
import { AuthUserContext } from '../../rbac/types/index.js';
import { Roles } from '../../rbac/constants/roles.js';
import { AppNotification, NotificationType, NotificationStatus } from '../types/index.js';

export class NotificationsService {
  private dynamicNotifications: AppNotification[] = [];
  private userReadMap: Map<string, Set<string>> = new Map();

  /**
   * Emit a real-time notification across the platform
   */
  public emitNotification(
    data: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'> & { createdAt?: string; isRead?: boolean }
  ): AppNotification {
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: data.createdAt || new Date().toISOString(),
      isRead: data.isRead || false,
      ...data,
    };

    this.dynamicNotifications.unshift(notif);
    if (this.dynamicNotifications.length > 150) {
      this.dynamicNotifications = this.dynamicNotifications.slice(0, 150);
    }
    return notif;
  }

  /**
   * List notifications tailored to the authenticated user and active dashboard role
   */
  public async getNotificationsForUser(
    user: AuthUserContext,
    activeRoleParam?: string
  ): Promise<AppNotification[]> {
    const userRole = (activeRoleParam || user.roles[0] || Roles.SALES_REP).toUpperCase();
    const userKey = user.userId || user.email.toLowerCase();
    const readSet = this.userReadMap.get(userKey) || new Set<string>();

    const generatedNotifications: AppNotification[] = [];

    try {
      if (userRole === Roles.CUSTOMER) {
        // Customer Portal Notifications
        const normalizedEmail = user.email.trim().toLowerCase();
        const customer = await db.query.customers.findFirst({
          where: eq(customers.email, normalizedEmail),
        });

        if (customer) {
          const quotes = await db.query.quotations.findMany({
            where: eq(quotations.customerId, customer.id),
            with: {
              approvals: true,
            },
            orderBy: [desc(quotations.updatedAt)],
            limit: 15,
          });

          for (const q of quotes) {
            const hasApprovals = q.approvals && q.approvals.length > 0;
            const managerAppr = q.approvals?.find((a) => a.approvalLevel === 'MANAGER');
            const financeAppr = q.approvals?.find((a) => a.approvalLevel === 'FINANCE');

            if (q.status === 'APPROVED') {
              const latestDate = q.approvals?.reduce((latest, a) => {
                const d = a.decidedAt ? new Date(a.decidedAt).toISOString() : latest;
                return d > latest ? d : latest;
              }, q.updatedAt.toISOString()) || q.updatedAt.toISOString();

              generatedNotifications.push({
                id: `audit_cust_appr_${q.id}`,
                title: `Quotation ${q.quotationNumber} Approved`,
                message: `Your quotation for ₹${Number(q.totalAmount).toLocaleString('en-IN')} has been approved by Sales Governance. Ready for order confirmation.`,
                type: 'APPROVAL',
                status: 'APPROVED',
                isRead: false,
                createdAt: latestDate,
                linkUrl: `/customer/quotations/${q.id}`,
                targetCustomerId: customer.id,
              });
            } else if (q.status === 'PENDING_APPROVAL' || q.status === 'PENDING_FINANCE_APPROVAL') {
              if (managerAppr && managerAppr.status === 'APPROVED') {
                generatedNotifications.push({
                  id: `audit_cust_mgrappr_${q.id}`,
                  title: `Sales Manager Review Completed`,
                  message: `Quotation ${q.quotationNumber} was approved by Sales Manager and escalated to Finance Operations.`,
                  type: 'APPROVAL',
                  status: 'INFO',
                  isRead: false,
                  createdAt: managerAppr.decidedAt ? new Date(managerAppr.decidedAt).toISOString() : q.updatedAt.toISOString(),
                  linkUrl: `/customer/quotations/${q.id}`,
                  targetCustomerId: customer.id,
                });
              } else {
                generatedNotifications.push({
                  id: `audit_cust_pend_${q.id}`,
                  title: `Quotation ${q.quotationNumber} Under Review`,
                  message: `Quotation is currently undergoing discount governance review.`,
                  type: 'QUOTATION',
                  status: 'PENDING',
                  isRead: false,
                  createdAt: q.updatedAt.toISOString(),
                  linkUrl: `/customer/quotations/${q.id}`,
                  targetCustomerId: customer.id,
                });
              }
            } else if (q.status === 'REJECTED') {
              generatedNotifications.push({
                id: `audit_cust_rej_${q.id}`,
                title: `Quotation ${q.quotationNumber} Rejected`,
                message: `Quotation was not approved during governance review.`,
                type: 'REJECTION',
                status: 'REJECTED',
                isRead: false,
                createdAt: q.updatedAt.toISOString(),
                linkUrl: `/customer/quotations/${q.id}`,
                targetCustomerId: customer.id,
              });
            } else if (q.status === 'DRAFT' || q.status === 'SENT') {
              generatedNotifications.push({
                id: `audit_cust_new_${q.id}`,
                title: `New Quotation ${q.quotationNumber}`,
                message: `A new commercial quotation has been prepared for your review (Total: ₹${Number(q.totalAmount).toLocaleString('en-IN')}).`,
                type: 'QUOTATION',
                status: 'INFO',
                isRead: false,
                createdAt: q.createdAt.toISOString(),
                linkUrl: `/customer/quotations/${q.id}`,
                targetCustomerId: customer.id,
              });
            }
          }
        }
      } else if (userRole === Roles.SALES_REP) {
        // Sales Representative Notifications
        const quotes = await db.query.quotations.findMany({
          where: eq(quotations.createdBy, user.userId),
          with: {
            customer: true,
            approvals: true,
          },
          orderBy: [desc(quotations.updatedAt)],
          limit: 15,
        });

        for (const q of quotes) {
          const custName = (q as any).customer?.companyName || 'Customer';
          if (q.status === 'APPROVED') {
            generatedNotifications.push({
              id: `audit_rep_appr_${q.id}`,
              title: `Quotation ${q.quotationNumber} Approved`,
              message: `Quotation for ${custName} (₹${Number(q.totalAmount).toLocaleString('en-IN')}) was approved by Governance.`,
              type: 'APPROVAL',
              status: 'APPROVED',
              isRead: false,
              createdAt: q.updatedAt.toISOString(),
              linkUrl: `/quotations/${q.id}`,
              targetUserId: user.userId,
            });
          } else if (q.status === 'REJECTED') {
            generatedNotifications.push({
              id: `audit_rep_rej_${q.id}`,
              title: `Quotation ${q.quotationNumber} Rejected`,
              message: `Quotation for ${custName} was rejected during governance review.`,
              type: 'REJECTION',
              status: 'REJECTED',
              isRead: false,
              createdAt: q.updatedAt.toISOString(),
              linkUrl: `/quotations/${q.id}`,
              targetUserId: user.userId,
            });
          } else if (q.status === 'PENDING_APPROVAL' || q.status === 'PENDING_FINANCE_APPROVAL') {
            generatedNotifications.push({
              id: `audit_rep_pend_${q.id}`,
              title: `Quote ${q.quotationNumber} In Review`,
              message: `Submitted for approval review (${custName}).`,
              type: 'QUOTATION',
              status: 'PENDING',
              isRead: false,
              createdAt: q.updatedAt.toISOString(),
              linkUrl: `/quotations/${q.id}`,
              targetUserId: user.userId,
            });
          } else if (q.status === 'DRAFT') {
            generatedNotifications.push({
              id: `audit_rep_draft_${q.id}`,
              title: `Draft Quote ${q.quotationNumber}`,
              message: `Quote prepared for ${custName}. Ready for submission.`,
              type: 'QUOTATION',
              status: 'INFO',
              isRead: false,
              createdAt: q.createdAt.toISOString(),
              linkUrl: `/quotations/${q.id}`,
              targetUserId: user.userId,
            });
          }
        }
      } else if (userRole === Roles.SALES_MANAGER) {
        // Sales Manager Notifications
        const approvalsList = await db.query.quotationApprovals.findMany({
          where: eq(quotationApprovals.approvalLevel, 'MANAGER'),
          with: {
            quotation: {
              with: {
                customer: true,
              },
            },
          },
          orderBy: [desc(quotationApprovals.updatedAt)],
          limit: 15,
        });

        for (const a of approvalsList) {
          const qNum = (a as any).quotation?.quotationNumber || 'Quote';
          const custName = (a as any).quotation?.customer?.companyName || 'Customer';
          const qId = (a as any).quotation?.id || '';

          if (a.status === 'PENDING') {
            generatedNotifications.push({
              id: `audit_mgr_act_${a.id}`,
              title: `Approval Required: ${qNum}`,
              message: `Quotation for ${custName} requires Manager approval review.`,
              type: 'APPROVAL',
              status: 'PENDING',
              isRead: false,
              createdAt: a.requestedAt.toISOString(),
              linkUrl: '/approvals',
              targetRoles: [Roles.SALES_MANAGER, Roles.ADMIN],
            });
          } else if (a.status === 'APPROVED') {
            generatedNotifications.push({
              id: `audit_mgr_done_${a.id}`,
              title: `Manager Approved: ${qNum}`,
              message: `Approval granted for ${custName} (${a.comments || 'Approved'}).`,
              type: 'APPROVAL',
              status: 'APPROVED',
              isRead: false,
              createdAt: a.decidedAt ? new Date(a.decidedAt).toISOString() : a.updatedAt.toISOString(),
              linkUrl: qId ? `/quotations/${qId}` : '/approvals',
              targetRoles: [Roles.SALES_MANAGER, Roles.ADMIN],
            });
          } else if (a.status === 'REJECTED') {
            generatedNotifications.push({
              id: `audit_mgr_rej_${a.id}`,
              title: `Manager Rejected: ${qNum}`,
              message: `Quotation for ${custName} was rejected (${a.comments || 'Rejected'}).`,
              type: 'REJECTION',
              status: 'REJECTED',
              isRead: false,
              createdAt: a.decidedAt ? new Date(a.decidedAt).toISOString() : a.updatedAt.toISOString(),
              linkUrl: qId ? `/quotations/${qId}` : '/approvals',
              targetRoles: [Roles.SALES_MANAGER, Roles.ADMIN],
            });
          }
        }
      } else if (userRole === Roles.FINANCE) {
        // Finance Officer Notifications
        const approvalsList = await db.query.quotationApprovals.findMany({
          where: eq(quotationApprovals.approvalLevel, 'FINANCE'),
          with: {
            quotation: {
              with: {
                customer: true,
              },
            },
          },
          orderBy: [desc(quotationApprovals.updatedAt)],
          limit: 15,
        });

        for (const a of approvalsList) {
          const qNum = (a as any).quotation?.quotationNumber || 'Quote';
          const custName = (a as any).quotation?.customer?.companyName || 'Customer';
          const qId = (a as any).quotation?.id || '';

          if (a.status === 'PENDING') {
            generatedNotifications.push({
              id: `audit_fin_act_${a.id}`,
              title: `Finance Approval Required: ${qNum}`,
              message: `Margin & profitability evaluation required for ${custName}.`,
              type: 'APPROVAL',
              status: 'PENDING',
              isRead: false,
              createdAt: a.requestedAt.toISOString(),
              linkUrl: '/approvals',
              targetRoles: [Roles.FINANCE, Roles.ADMIN],
            });
          } else if (a.status === 'APPROVED') {
            generatedNotifications.push({
              id: `audit_fin_done_${a.id}`,
              title: `Finance Approved: ${qNum}`,
              message: `Finance approval confirmed for ${custName}.`,
              type: 'APPROVAL',
              status: 'APPROVED',
              isRead: false,
              createdAt: a.decidedAt ? new Date(a.decidedAt).toISOString() : a.updatedAt.toISOString(),
              linkUrl: qId ? `/quotations/${qId}` : '/approvals',
              targetRoles: [Roles.FINANCE, Roles.ADMIN],
            });
          }
        }
      } else if (userRole === Roles.ADMIN) {
        // Admin: Global Activity & Audit Trail
        const recentQuotes = await db.query.quotations.findMany({
          with: {
            customer: true,
            approvals: true,
          },
          orderBy: [desc(quotations.updatedAt)],
          limit: 20,
        });

        for (const q of recentQuotes) {
          const custName = (q as any).customer?.companyName || 'Customer';
          if (q.status === 'APPROVED') {
            generatedNotifications.push({
              id: `audit_adm_appr_${q.id}`,
              title: `Quote ${q.quotationNumber} Approved`,
              message: `Quotation for ${custName} (₹${Number(q.totalAmount).toLocaleString('en-IN')}) approved.`,
              type: 'APPROVAL',
              status: 'APPROVED',
              isRead: false,
              createdAt: q.updatedAt.toISOString(),
              linkUrl: `/quotations/${q.id}`,
            });
          } else if (q.status === 'PENDING_APPROVAL' || q.status === 'PENDING_FINANCE_APPROVAL') {
            generatedNotifications.push({
              id: `audit_adm_pend_${q.id}`,
              title: `Pending Approval: ${q.quotationNumber}`,
              message: `Approval workflow active for ${custName} (${q.status}).`,
              type: 'APPROVAL',
              status: 'PENDING',
              isRead: false,
              createdAt: q.updatedAt.toISOString(),
              linkUrl: '/approvals',
            });
          } else if (q.status === 'REJECTED') {
            generatedNotifications.push({
              id: `audit_adm_rej_${q.id}`,
              title: `Quote ${q.quotationNumber} Rejected`,
              message: `Governance rejection recorded for ${custName}.`,
              type: 'REJECTION',
              status: 'REJECTED',
              isRead: false,
              createdAt: q.updatedAt.toISOString(),
              linkUrl: `/quotations/${q.id}`,
            });
          }
        }
      }
    } catch (err) {
      console.error('[NotificationsService] Error loading DB audit notifications:', err);
    }

    // Merge with dynamic in-memory notifications matching role / user
    const dynamicFiltered = this.dynamicNotifications.filter((n) => {
      if (userRole === Roles.ADMIN) return true;
      if (n.targetUserId && n.targetUserId === user.userId) return true;
      if (n.targetRoles && n.targetRoles.includes(userRole)) return true;
      if (userRole === Roles.CUSTOMER && n.targetRoles?.includes(Roles.CUSTOMER)) return true;
      return false;
    });

    // Merge and deduplicate by ID
    const notifMap = new Map<string, AppNotification>();
    for (const n of dynamicFiltered) {
      notifMap.set(n.id, { ...n });
    }
    for (const n of generatedNotifications) {
      if (!notifMap.has(n.id)) {
        notifMap.set(n.id, { ...n });
      }
    }

    // Apply read state
    const result: AppNotification[] = Array.from(notifMap.values()).map((n) => ({
      ...n,
      isRead: n.isRead || readSet.has(n.id),
    }));

    // Sort by timestamp descending
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result.slice(0, 30);
  }

  /**
   * Mark a single notification as read
   */
  public markNotificationRead(id: string, userKey: string): boolean {
    if (!this.userReadMap.has(userKey)) {
      this.userReadMap.set(userKey, new Set<string>());
    }
    this.userReadMap.get(userKey)!.add(id);

    const dynamicItem = this.dynamicNotifications.find((n) => n.id === id);
    if (dynamicItem) {
      dynamicItem.isRead = true;
    }
    return true;
  }

  /**
   * Mark all notifications as read for a user
   */
  public markAllNotificationsRead(userKey: string, notificationIds: string[]): boolean {
    if (!this.userReadMap.has(userKey)) {
      this.userReadMap.set(userKey, new Set<string>());
    }
    const readSet = this.userReadMap.get(userKey)!;
    for (const id of notificationIds) {
      readSet.add(id);
    }
    this.dynamicNotifications.forEach((n) => {
      if (notificationIds.includes(n.id)) {
        n.isRead = true;
      }
    });
    return true;
  }
}

export const notificationsService = new NotificationsService();
