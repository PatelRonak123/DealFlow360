import { db } from '../../../database/db.js';
import {
  customers,
  customerTiers,
  quotations,
  quotationItems,
  quotationApprovals,
} from '../../../database/schema/index.js';
import { eq, desc, and, or, ilike } from 'drizzle-orm';
import {
  CustomerDashboardMetrics,
  CustomerQuotationDetail,
  CustomerQuotationItem,
  CustomerOrder,
  CustomerInvoice,
  CustomerPayment,
  CustomerSubscription,
  CustomerNotification,
  CustomerProfile,
  NegotiationHistoryEntry,
  ApprovalStep,
} from '../types/customerPortal.types.js';
import { notificationsService } from '../../notifications/services/notifications.service.js';

interface InMemoryCustomerData {
  profileExtra?: {
    taxId?: string;
    billingAddress?: string;
    shippingAddress?: string;
  };
  orders: CustomerOrder[];
  invoices: CustomerInvoice[];
  payments: CustomerPayment[];
  subscriptions: CustomerSubscription[];
  notifications: CustomerNotification[];
  negotiationHistory: Record<string, NegotiationHistoryEntry[]>;
}

import { usersRepository } from '../../users/repositories/users.repository.js';

interface ResolvedCustomer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  tierName: string;
  customerTierId: string;
}

interface CachedCustomer {
  customer: ResolvedCustomer | null;
  expiresAt: number;
}

export class CustomerPortalRepository {
  // Keyed by customer identifier (email or customerId) to store session-specific orders, invoices, payments, and notifications
  private customerStores = new Map<string, InMemoryCustomerData>();
  private customerCache = new Map<string, CachedCustomer>();
  private inFlightResolutions = new Map<string, Promise<ResolvedCustomer | null>>();
  private readonly CUSTOMER_CACHE_TTL_MS = 60 * 1000; // 60 seconds

  invalidateCustomerCache(key?: string): void {
    if (key) {
      this.customerCache.delete(key.trim().toLowerCase());
    } else {
      this.customerCache.clear();
    }
  }

  private getStore(key: string): InMemoryCustomerData {
    const normalizedKey = key.trim().toLowerCase();
    if (!this.customerStores.has(normalizedKey)) {
      this.customerStores.set(normalizedKey, {
        orders: [],
        invoices: [],
        payments: [],
        subscriptions: [],
        notifications: [],
        negotiationHistory: {},
      });
    }
    return this.customerStores.get(normalizedKey)!;
  }

  /**
   * Resolves the customer entity from the database by customerId or email with fast caching & deduplication
   */
  async resolveCustomer(
    customerId?: string,
    userEmail?: string
  ): Promise<ResolvedCustomer | null> {
    const cacheKey = (customerId || userEmail || '').trim().toLowerCase();
    if (!cacheKey) return null;

    const cached = this.customerCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.customer;
    }

    if (this.inFlightResolutions.has(cacheKey)) {
      return this.inFlightResolutions.get(cacheKey)!;
    }

    const resolvePromise = (async () => {
      try {
        if (customerId) {
          const found = await db.query.customers.findFirst({
            where: eq(customers.id, customerId),
            with: { customerTier: true },
          });
          if (found) {
            const res: ResolvedCustomer = {
              id: found.id,
              companyName: found.companyName,
              contactName: found.contactName || '',
              email: found.email,
              phone: found.phone || '',
              tierName: (found as any).customerTier?.name || 'Standard Tier',
              customerTierId: found.customerTierId,
            };
            this.customerCache.set(cacheKey, { customer: res, expiresAt: Date.now() + this.CUSTOMER_CACHE_TTL_MS });
            if (found.email) {
              this.customerCache.set(found.email.toLowerCase(), { customer: res, expiresAt: Date.now() + this.CUSTOMER_CACHE_TTL_MS });
            }
            return res;
          }
        }

        if (userEmail) {
          const normalized = userEmail.trim().toLowerCase();
          const found = await db.query.customers.findFirst({
            where: eq(customers.email, normalized),
            with: { customerTier: true },
          });
          if (found) {
            const res: ResolvedCustomer = {
              id: found.id,
              companyName: found.companyName,
              contactName: found.contactName || '',
              email: found.email,
              phone: found.phone || '',
              tierName: (found as any).customerTier?.name || 'Standard Tier',
              customerTierId: found.customerTierId,
            };
            this.customerCache.set(cacheKey, { customer: res, expiresAt: Date.now() + this.CUSTOMER_CACHE_TTL_MS });
            this.customerCache.set(found.id.toLowerCase(), { customer: res, expiresAt: Date.now() + this.CUSTOMER_CACHE_TTL_MS });
            return res;
          }
        }

        this.customerCache.set(cacheKey, { customer: null, expiresAt: Date.now() + this.CUSTOMER_CACHE_TTL_MS });
        return null;
      } catch {
        return null;
      } finally {
        this.inFlightResolutions.delete(cacheKey);
      }
    })();

    this.inFlightResolutions.set(cacheKey, resolvePromise);
    return resolvePromise;
  }

  /**
   * Get Profile from database
   */
  async getProfile(
    customerId?: string,
    userEmail?: string,
    userName?: string
  ): Promise<CustomerProfile> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    const storeKey = customer?.id || userEmail || 'unknown';
    const store = this.getStore(storeKey);

    if (customer) {
      return {
        id: customer.id,
        companyName: customer.companyName,
        contactName: customer.contactName || userName || '',
        email: customer.email,
        phone: customer.phone,
        tierName: customer.tierName,
        taxId: store.profileExtra?.taxId || '',
        billingAddress: store.profileExtra?.billingAddress || '',
        shippingAddress: store.profileExtra?.shippingAddress || '',
      };
    }

    // Default profile for new customer before saving organization
    return {
      id: 'pending_organization',
      companyName: '',
      contactName: userName || '',
      email: userEmail || '',
      phone: '',
      tierName: 'Standard Tier',
      taxId: store.profileExtra?.taxId || '',
      billingAddress: store.profileExtra?.billingAddress || '',
      shippingAddress: store.profileExtra?.shippingAddress || '',
    };
  }

  /**
   * Update Profile in database so Sales Representatives can find and create quotes for this customer
   */
  async updateProfile(
    data: Partial<CustomerProfile>,
    customerId?: string,
    userEmail?: string,
    userName?: string
  ): Promise<CustomerProfile> {
    const customer = await this.resolveCustomer(customerId, userEmail || data.email);
    const effectiveEmail = (data.email || userEmail || customer?.email || '').trim().toLowerCase();

    let savedCustomerId = customer?.id;
    let tierName = customer?.tierName || 'Standard Tier';

    if (customer) {
      // Update existing customer row in DB
      await db
        .update(customers)
        .set({
          companyName: data.companyName ? data.companyName.trim() : customer.companyName,
          contactName: data.contactName !== undefined ? data.contactName?.trim() || null : customer.contactName,
          phone: data.phone !== undefined ? data.phone?.trim() || null : customer.phone,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customer.id));
      savedCustomerId = customer.id;
    } else if (effectiveEmail) {
      // Create new customer entity in DB
      let defaultTier = await db.query.customerTiers.findFirst({
        where: eq(customerTiers.isActive, true),
      });

      if (!defaultTier) {
        const [insertedTier] = await db
          .insert(customerTiers)
          .values({
            name: 'Standard Tier',
            description: 'Default commercial tier',
            isActive: true,
          })
          .returning();
        defaultTier = insertedTier;
      }

      const [newCust] = await db
        .insert(customers)
        .values({
          companyName: data.companyName?.trim() || 'My Organization',
          contactName: data.contactName?.trim() || userName || null,
          email: effectiveEmail,
          phone: data.phone?.trim() || null,
          customerTierId: defaultTier.id,
          status: 'ACTIVE',
        })
        .returning();

      savedCustomerId = newCust.id;
      tierName = defaultTier.name;
    }

    // Persist additional metadata (taxId, billingAddress, shippingAddress) in session store
    const storeKey = savedCustomerId || effectiveEmail || 'unknown';
    const store = this.getStore(storeKey);
    store.profileExtra = {
      taxId: data.taxId !== undefined ? data.taxId : store.profileExtra?.taxId,
      billingAddress: data.billingAddress !== undefined ? data.billingAddress : store.profileExtra?.billingAddress,
      shippingAddress: data.shippingAddress !== undefined ? data.shippingAddress : store.profileExtra?.shippingAddress,
    };

    // Invalidate cached customer records so next fetches reflect new state immediately
    if (savedCustomerId) {
      this.invalidateCustomerCache(savedCustomerId);
    }
    if (effectiveEmail) {
      this.invalidateCustomerCache(effectiveEmail);
    }
    usersRepository.invalidateCache();

    return {
      id: savedCustomerId || 'cust_temp',
      companyName: data.companyName || customer?.companyName || '',
      contactName: data.contactName || customer?.contactName || userName || '',
      email: effectiveEmail,
      phone: data.phone || customer?.phone || '',
      tierName,
      taxId: store.profileExtra.taxId || '',
      billingAddress: store.profileExtra.billingAddress || '',
      shippingAddress: store.profileExtra.shippingAddress || '',
    };
  }

  /**
   * Maps database quotation and related records to CustomerQuotationDetail
   */
  private mapDbQuotationToDetail(
    quote: any,
    customer: { id: string; companyName: string; contactName: string; email: string },
    negotiationHistory: NegotiationHistoryEntry[] = []
  ): CustomerQuotationDetail {
    const rawItems = Array.isArray(quote.items) ? quote.items : [];
    const items: CustomerQuotationItem[] = rawItems.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productNameSnapshot || 'Product Item',
      sku: item.skuSnapshot || 'SKU-GEN',
      quantity: item.quantity,
      unitPrice: String(item.unitPrice || '0.00'),
      discountPercent: String(item.discountPercent || '0.00'),
      grossAmount: String(item.grossAmount || '0.00'),
      discountAmount: String(item.discountAmount || '0.00'),
      netAmount: String(item.netAmount || '0.00'),
    }));

    const rawApprovals = Array.isArray(quote.approvals) ? quote.approvals : [];
    const approvalSteps: ApprovalStep[] = rawApprovals.map((app: any) => ({
      level: app.approvalLevel === 'MANAGER' ? 'SALES_MANAGER' : 'FINANCE',
      status: app.status as any,
      approverName: app.decidedByUser?.name || (app.approvalLevel === 'MANAGER' ? 'Sales Manager' : 'Finance Officer'),
      decidedAt: app.decidedAt ? new Date(app.decidedAt).toISOString() : undefined,
      comments: app.comments || undefined,
    }));

    let overallApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED' = 'NOT_REQUIRED';
    if (approvalSteps.length > 0) {
      if (approvalSteps.some((s) => s.status === 'REJECTED')) {
        overallApprovalStatus = 'REJECTED';
      } else if (approvalSteps.every((s) => s.status === 'APPROVED')) {
        overallApprovalStatus = 'APPROVED';
      } else if (approvalSteps.some((s) => s.status === 'PENDING')) {
        overallApprovalStatus = 'PENDING';
      }
    }

    const subtotalNum = parseFloat(quote.subtotal || '0');
    const discountNum = parseFloat(quote.discountAmount || '0');
    const totalNum = parseFloat(quote.totalAmount || '0');
    const discountPercent = subtotalNum > 0 ? Math.round((discountNum / subtotalNum) * 100) : 0;
    const taxAmount = (totalNum * 0.18).toFixed(2);

    // Synchronize live database approval step statuses into negotiation history entries
    let syncedHistory: NegotiationHistoryEntry[] = (negotiationHistory || []).map((entry) => {
      const updatedApprovals = (entry.approvals && entry.approvals.length > 0 ? entry.approvals : approvalSteps).map((appr) => {
        const liveStep = approvalSteps.find((s) => s.level === appr.level);
        if (liveStep) {
          return {
            ...appr,
            status: liveStep.status,
            approverName: liveStep.approverName || appr.approverName,
            decidedAt: liveStep.decidedAt || appr.decidedAt,
            comments: liveStep.comments !== undefined ? liveStep.comments : appr.comments,
          };
        }
        return appr;
      });

      const effectiveApprovals = updatedApprovals.length > 0 ? updatedApprovals : approvalSteps;

      let entryStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' = entry.status;
      if (effectiveApprovals.length > 0) {
        if (effectiveApprovals.some((a) => a.status === 'REJECTED')) {
          entryStatus = 'REJECTED';
        } else if (effectiveApprovals.every((a) => a.status === 'APPROVED')) {
          entryStatus = 'APPROVED';
        } else {
          entryStatus = 'PENDING';
        }
      }

      return {
        ...entry,
        status: entryStatus,
        approvals: effectiveApprovals,
      };
    });

    if (
      syncedHistory.length === 0 &&
      (quote.status === 'PENDING_APPROVAL' || quote.status === 'APPROVED' || quote.status === 'NEGOTIATION') &&
      discountPercent > 0
    ) {
      let entryStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' = 'PENDING';
      if (approvalSteps.length > 0) {
        if (approvalSteps.some((a) => a.status === 'REJECTED')) {
          entryStatus = 'REJECTED';
        } else if (approvalSteps.every((a) => a.status === 'APPROVED')) {
          entryStatus = 'APPROVED';
        }
      }
      syncedHistory = [
        {
          id: `neg_${quote.id}`,
          quotationId: quote.id,
          requestedBy: customer.contactName || 'Customer',
          requestedRole: 'CUSTOMER',
          requestedDiscountPercent: discountPercent,
          reason: quote.notes || 'Commercial discount adjustment request.',
          changeRequests: ['Higher Volume Pricing / Tier Commitment'],
          status: entryStatus,
          approvals: approvalSteps,
          createdAt: quote.updatedAt ? new Date(quote.updatedAt).toISOString() : new Date().toISOString(),
        },
      ];
    }

    return {
      id: quote.id,
      quotationNumber: quote.quotationNumber,
      customerId: customer.id,
      customerName: customer.companyName,
      status: quote.status,
      currency: quote.currency || 'INR',
      subtotal: quote.subtotal || '0.00',
      discountAmount: quote.discountAmount || '0.00',
      discountPercent,
      taxAmount,
      shippingAmount: '0.00',
      totalAmount: quote.totalAmount || '0.00',
      issueDate: quote.issueDate || (quote.createdAt ? new Date(quote.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      expiryDate: quote.expiryDate || (quote.createdAt ? new Date(quote.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      notes: quote.notes || undefined,
      items,
      negotiationHistory: syncedHistory,
      approvalStatus: {
        overallStatus: overallApprovalStatus,
        steps: approvalSteps,
      },
    };
  }

  /**
   * Find quotations for customer from PostgreSQL database
   */
  async findQuotations(
    query?: { search?: string; status?: string },
    customerId?: string,
    userEmail?: string
  ): Promise<CustomerQuotationDetail[]> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) {
      return [];
    }

    try {
      const conditions = [eq(quotations.customerId, customer.id)];

      if (query?.status && query.status !== 'ALL') {
        conditions.push(eq(quotations.status, query.status));
      }

      if (query?.search) {
        conditions.push(
          or(
            ilike(quotations.quotationNumber, `%${query.search}%`),
            ilike(quotations.notes, `%${query.search}%`)
          )!
        );
      }

      const rows = await db.query.quotations.findMany({
        where: and(...conditions),
        with: {
          items: true,
          approvals: {
            with: {
              decidedByUser: true,
            },
          },
        },
        orderBy: desc(quotations.createdAt),
      });

      const store = this.getStore(customer.id);

      return rows.map((r) =>
        this.mapDbQuotationToDetail(r, customer, store.negotiationHistory[r.id] || [])
      );
    } catch {
      return [];
    }
  }

  /**
   * Find a specific quotation by ID or Number
   */
  async findQuotationById(
    id: string,
    customerId?: string,
    userEmail?: string
  ): Promise<CustomerQuotationDetail | undefined> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) return undefined;

    try {
      const row = await db.query.quotations.findFirst({
        where: and(
          eq(quotations.customerId, customer.id),
          or(eq(quotations.id, id), eq(quotations.quotationNumber, id))
        ),
        with: {
          items: true,
          approvals: {
            with: {
              decidedByUser: true,
            },
          },
        },
      });

      if (!row) return undefined;

      const store = this.getStore(customer.id);
      return this.mapDbQuotationToDetail(row, customer, store.negotiationHistory[row.id] || []);
    } catch {
      return undefined;
    }
  }

  /**
   * Submit negotiation counter-offer for a quotation
   */
  async submitNegotiation(
    quotationId: string,
    data: {
      requestedDiscountPercent: number;
      reason: string;
      changeRequests?: string[];
      message?: string;
    },
    customerId?: string,
    userEmail?: string,
    userName?: string
  ): Promise<CustomerQuotationDetail> {
    const quote = await this.findQuotationById(quotationId, customerId, userEmail);
    if (!quote) {
      throw new Error(`Quotation with ID '${quotationId}' not found or access denied`);
    }

    const requestedDiscount = data.requestedDiscountPercent;
    let newStatus: 'NEGOTIATION' | 'PENDING_APPROVAL' | 'APPROVED' = 'NEGOTIATION';
    const approvalSteps: ApprovalStep[] = [];

    if (requestedDiscount <= 10) {
      newStatus = 'APPROVED';
      approvalSteps.push({
        level: 'SALES_MANAGER',
        status: 'APPROVED',
        approverName: 'Automated Governance System',
        decidedAt: new Date().toISOString(),
        comments: 'Within authorized 10% standard tier threshold. Automatically pre-approved.',
      });
    } else if (requestedDiscount <= 20) {
      newStatus = 'PENDING_APPROVAL';
      approvalSteps.push({
        level: 'SALES_MANAGER',
        status: 'PENDING',
        approverName: 'Sales Director',
        comments: 'Pending Sales Manager review for discount between 10% and 20%.',
      });
    } else {
      newStatus = 'PENDING_APPROVAL';
      approvalSteps.push(
        {
          level: 'SALES_MANAGER',
          status: 'PENDING',
          approverName: 'Sales Director',
          comments: 'Tier 1 Approval Required for high discount request (>20%).',
        },
        {
          level: 'FINANCE',
          status: 'PENDING',
          approverName: 'Finance Lead',
          comments: 'Tier 2 Financial Margin & Profitability Review Required.',
        }
      );
    }

    const subtotalNum = parseFloat(quote.subtotal) || 0;
    const newDiscountAmount = ((subtotalNum * requestedDiscount) / 100).toFixed(2);
    const newTotal = (subtotalNum - parseFloat(newDiscountAmount)).toFixed(2);

    // Update quotation in DB
    await db
      .update(quotations)
      .set({
        status: newStatus,
        discountAmount: newDiscountAmount,
        totalAmount: newTotal,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quote.id));

    const newHistoryEntry: NegotiationHistoryEntry = {
      id: `neg_${Date.now()}`,
      quotationId: quote.id,
      requestedBy: userName || quote.customerName || 'Customer',
      requestedRole: 'CUSTOMER',
      requestedDiscountPercent: requestedDiscount,
      reason: data.reason || data.message || 'Customer requested commercial discount adjustment.',
      changeRequests: data.changeRequests,
      status: newStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
      approvals: approvalSteps,
      comments: data.message,
      createdAt: new Date().toISOString(),
    };

    const store = this.getStore(quote.customerId || userEmail || 'unknown');
    if (!store.negotiationHistory[quote.id]) {
      store.negotiationHistory[quote.id] = [];
    }
    store.negotiationHistory[quote.id].unshift(newHistoryEntry);

    const notifItem = {
      id: `notif_${Date.now()}`,
      title: `Negotiation Submitted for ${quote.quotationNumber}`,
      message: `Your request for ${requestedDiscount}% discount has been submitted to Sales Governance.`,
      type: 'NEGOTIATION' as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: `/customer/quotations/${quote.id}`,
    };
    store.notifications.unshift(notifItem);

    notificationsService.emitNotification({
      title: `Counter-Offer: ${quote.quotationNumber}`,
      message: `${quote.customerName || 'Customer'} submitted a negotiation request (${requestedDiscount}% discount).`,
      type: 'NEGOTIATION',
      status: 'PENDING',
      targetRoles: ['SALES_REP', 'SALES_MANAGER', 'ADMIN'],
      linkUrl: `/quotations/${quote.id}`,
    });

    return (await this.findQuotationById(quotationId, customerId, userEmail))!;
  }

  /**
   * Confirm quotation and generate order & invoice
   */
  async confirmQuotation(
    quotationId: string,
    customerId?: string,
    userEmail?: string
  ): Promise<{ quotation: CustomerQuotationDetail; order: CustomerOrder }> {
    const quote = await this.findQuotationById(quotationId, customerId, userEmail);
    if (!quote) {
      throw new Error(`Quotation with ID '${quotationId}' not found or access denied`);
    }

    // Update DB status to CONFIRMED
    await db
      .update(quotations)
      .set({
        status: 'CONFIRMED',
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quote.id));

    quote.status = 'CONFIRMED';
    const orderNum = `ORD-${quote.quotationNumber.replace(/^QT-|^Q-/, '')}`;
    const orderId = `ord_${Date.now()}`;

    quote.orderId = orderId;
    quote.orderNumber = orderNum;

    const store = this.getStore(quote.customerId || userEmail || 'unknown');

    const newOrder: CustomerOrder = {
      id: orderId,
      orderNumber: orderNum,
      quotationId: quote.id,
      quotationNumber: quote.quotationNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      totalAmount: quote.totalAmount,
      currency: quote.currency,
      fulfillmentStatus: 'PROCESSING',
      paymentStatus: 'UNPAID',
      orderDate: new Date().toISOString().split('T')[0],
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      carrier: 'Logistics Dispatch Network',
      trackingNumber: `TRK-IN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      warehouseName: 'Central Fulfillment Hub',
      items: quote.items,
      timeline: [
        {
          stage: 'CONFIRMED',
          timestamp: new Date().toISOString(),
          completed: true,
          description: `Quotation ${quote.quotationNumber} confirmed and converted to order ${orderNum}.`,
        },
        {
          stage: 'PROCESSING',
          timestamp: new Date().toISOString(),
          completed: true,
          description: 'Warehouse inventory allocation in progress.',
        },
        {
          stage: 'PACKED',
          timestamp: '',
          completed: false,
          description: 'Pick & pack verification.',
        },
        {
          stage: 'SHIPPED',
          timestamp: '',
          completed: false,
          description: 'Carrier dispatch scheduled.',
        },
        {
          stage: 'DELIVERED',
          timestamp: '',
          completed: false,
          description: 'Delivery to destination address.',
        },
      ],
    };

    store.orders.unshift(newOrder);

    const invoiceId = `inv_${Date.now()}`;
    const invoiceNum = `INV-${quote.quotationNumber.replace(/^QT-|^Q-/, '')}`;
    const newInvoice: CustomerInvoice = {
      id: invoiceId,
      invoiceNumber: invoiceNum,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      quotationNumber: quote.quotationNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      amountPaid: '0.00',
      balanceDue: quote.totalAmount,
      currency: quote.currency,
      status: 'ISSUED',
      items: quote.items,
    };

    store.invoices.unshift(newInvoice);

    const notifItem = {
      id: `notif_${Date.now()}`,
      title: `Order Created: ${newOrder.orderNumber}`,
      message: `Quotation ${quote.quotationNumber} has been converted to Order ${newOrder.orderNumber}.`,
      type: 'ORDER' as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: `/customer/orders/${newOrder.id}`,
    };
    store.notifications.unshift(notifItem);

    notificationsService.emitNotification({
      title: `Deal Won: ${quote.quotationNumber}`,
      message: `${quote.customerName || 'Customer'} confirmed quotation ${quote.quotationNumber} — Order ${newOrder.orderNumber} created.`,
      type: 'ORDER',
      status: 'APPROVED',
      targetRoles: ['SALES_REP', 'FINANCE', 'ADMIN'],
      linkUrl: `/quotations/${quote.id}`,
    });

    return { quotation: quote, order: newOrder };
  }

  /**
   * Real-time dashboard metrics computed purely from customer database quotes & session orders/invoices
   */
  async getDashboardMetrics(customerId?: string, userEmail?: string): Promise<CustomerDashboardMetrics> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) {
      return {
        activeQuotations: 0,
        pendingNegotiations: 0,
        confirmedOrders: 0,
        outstandingInvoices: 0,
        recentQuotations: [],
        recentOrders: [],
        recentActivity: [],
      };
    }

    const quotes = await this.findQuotations(undefined, customer.id, userEmail);
    const store = this.getStore(customer.id);

    const activeQuotations = quotes.filter(
      (q) => q.status === 'APPROVED' || q.status === 'DRAFT' || q.status === 'NEGOTIATION' || q.status === 'PENDING_APPROVAL'
    ).length;

    const pendingNegotiations = quotes.filter(
      (q) => q.status === 'NEGOTIATION' || q.status === 'PENDING_APPROVAL'
    ).length;

    const confirmedOrders = store.orders.length;

    const outstandingInvoices = store.invoices.filter(
      (inv) => inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE'
    ).length;

    const recentQuotations = quotes.slice(0, 5).map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      totalAmount: q.totalAmount,
      status: q.status,
      currency: q.currency,
      expiryDate: q.expiryDate,
      issueDate: q.issueDate,
    }));

    const recentOrders = store.orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      quotationNumber: o.quotationNumber,
      totalAmount: o.totalAmount,
      fulfillmentStatus: o.fulfillmentStatus,
      paymentStatus: o.paymentStatus,
      orderDate: o.orderDate,
    }));

    const liveNotifs = await this.findNotifications(customerId, userEmail);
    const recentActivity = liveNotifs.slice(0, 6).map((n) => ({
      id: n.id,
      title: n.title,
      description: n.message,
      timestamp: n.createdAt,
      type: n.type.toLowerCase() as any,
    }));

    return {
      activeQuotations,
      pendingNegotiations,
      confirmedOrders,
      outstandingInvoices,
      recentQuotations,
      recentOrders,
      recentActivity,
    };
  }

  async findOrders(customerId?: string, userEmail?: string): Promise<CustomerOrder[]> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) return [];
    const store = this.getStore(customer.id);
    return store.orders;
  }

  async findOrderById(id: string, customerId?: string, userEmail?: string): Promise<CustomerOrder | undefined> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) return undefined;
    const store = this.getStore(customer.id);
    return store.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  async findInvoices(customerId?: string, userEmail?: string): Promise<CustomerInvoice[]> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) return [];
    const store = this.getStore(customer.id);
    return store.invoices;
  }

  async findInvoiceById(id: string, customerId?: string, userEmail?: string): Promise<CustomerInvoice | undefined> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) return undefined;
    const store = this.getStore(customer.id);
    return store.invoices.find((inv) => inv.id === id || inv.invoiceNumber === id);
  }

  async payInvoice(
    invoiceId: string,
    data: { amount: string; paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI' },
    customerId?: string,
    userEmail?: string
  ): Promise<{ invoice: CustomerInvoice; payment: CustomerPayment }> {
    const invoice = await this.findInvoiceById(invoiceId, customerId, userEmail);
    if (!invoice) {
      throw new Error(`Invoice with ID '${invoiceId}' not found or access denied`);
    }

    const payAmount = parseFloat(data.amount) || parseFloat(invoice.balanceDue);
    const newPaid = (parseFloat(invoice.amountPaid) + payAmount).toFixed(2);
    const newBalance = Math.max(0, parseFloat(invoice.totalAmount) - parseFloat(newPaid)).toFixed(2);

    invoice.amountPaid = newPaid;
    invoice.balanceDue = newBalance;
    invoice.status = parseFloat(newBalance) <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    const customer = await this.resolveCustomer(customerId, userEmail);
    const store = this.getStore(customer?.id || userEmail || 'unknown');

    const order = store.orders.find((o) => o.id === invoice.orderId);
    if (order) {
      order.paymentStatus = invoice.status === 'PAID' ? 'PAID' : 'PARTIALLY_PAID';
    }

    const payment: CustomerPayment = {
      id: `pay_${Date.now()}`,
      paymentNumber: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderNumber: invoice.orderNumber,
      amount: payAmount.toFixed(2),
      currency: invoice.currency,
      paymentMethod: data.paymentMethod,
      transactionReference: `TXN-IN-${Math.floor(100000000 + Math.random() * 900000000)}`,
      status: 'SUCCESS',
      paidAt: new Date().toISOString(),
    };

    store.payments.unshift(payment);

    store.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: `Payment Processed: ${payment.paymentNumber}`,
      message: `Payment of ₹${payment.amount} for invoice ${invoice.invoiceNumber} was successful.`,
      type: 'PAYMENT',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: `/customer/payments`,
    });

    return { invoice, payment };
  }

  async findPayments(customerId?: string, userEmail?: string): Promise<CustomerPayment[]> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) return [];
    const store = this.getStore(customer.id);
    return store.payments;
  }

  async findSubscriptions(customerId?: string, userEmail?: string): Promise<CustomerSubscription[]> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) return [];
    const store = this.getStore(customer.id);
    return store.subscriptions;
  }

  async findSubscriptionById(id: string, customerId?: string, userEmail?: string): Promise<CustomerSubscription | undefined> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    if (!customer) return undefined;
    const store = this.getStore(customer.id);
    return store.subscriptions.find((s) => s.id === id);
  }

  async findNotifications(customerId?: string, userEmail?: string): Promise<CustomerNotification[]> {
    const customer = await this.resolveCustomer(customerId, userEmail);
    const userEmailResolved = userEmail || customer?.email || '';
    const userIdResolved = customer?.id || userEmailResolved;

    const notifs = await notificationsService.getNotificationsForUser(
      {
        userId: userIdResolved,
        email: userEmailResolved,
        name: customer?.contactName || customer?.companyName || userEmailResolved || 'Customer',
        roles: ['CUSTOMER'],
        permissions: [],
      },
      'CUSTOMER'
    );

    return notifs.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as any,
      isRead: n.isRead,
      createdAt: n.createdAt,
      linkUrl: n.linkUrl,
    }));
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    for (const store of this.customerStores.values()) {
      const notif = store.notifications.find((n) => n.id === id);
      if (notif) {
        notif.isRead = true;
      }
    }
    return notificationsService.markNotificationRead(id, 'CUSTOMER');
  }

  async markAllNotificationsAsRead(): Promise<boolean> {
    for (const store of this.customerStores.values()) {
      store.notifications.forEach((n) => {
        n.isRead = true;
      });
    }
    return notificationsService.markAllNotificationsRead('CUSTOMER', []);
  }
}

export const customerPortalRepository = new CustomerPortalRepository();
