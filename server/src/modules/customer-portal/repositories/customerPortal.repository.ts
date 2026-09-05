import { db } from '../../../database/db.js';
import {
  CustomerDashboardMetrics,
  CustomerQuotationDetail,
  CustomerOrder,
  CustomerInvoice,
  CustomerPayment,
  CustomerSubscription,
  CustomerNotification,
  CustomerProfile,
  NegotiationHistoryEntry,
} from '../types/customerPortal.types.js';

// In-memory persistent state store for customer portal operations to support seamless demo & DB integration
interface CustomerPortalStore {
  quotations: CustomerQuotationDetail[];
  orders: CustomerOrder[];
  invoices: CustomerInvoice[];
  payments: CustomerPayment[];
  subscriptions: CustomerSubscription[];
  notifications: CustomerNotification[];
  profile: CustomerProfile;
}

const DEFAULT_STORE: CustomerPortalStore = {
  profile: {
    id: 'cust_abc_industries',
    companyName: 'ABC Industries Pvt. Ltd.',
    contactName: 'Vikram Mehta',
    email: 'vikram.mehta@abcindustries.com',
    phone: '+91 98765 43210',
    billingAddress: 'Tower 4, Level 8, Cyber City, Gurugram, Haryana - 122002',
    shippingAddress: 'Plot 45, Sector 18, Industrial Area, Gurugram, Haryana - 122015',
    tierName: 'Enterprise Gold',
    taxId: 'GSTIN07AAAAA0000A1Z5',
  },
  quotations: [
    {
      id: 'quote_1024',
      quotationNumber: 'Q-1024',
      customerId: 'cust_abc_industries',
      customerName: 'ABC Industries Pvt. Ltd.',
      status: 'APPROVED',
      currency: 'INR',
      subtotal: '941176.47',
      discountAmount: '141176.47',
      discountPercent: 15,
      taxAmount: '144000.00',
      shippingAmount: '0.00',
      totalAmount: '800000.00',
      issueDate: '2026-09-01',
      expiryDate: '2026-09-30',
      notes: 'Custom enterprise deployment including 24/7 dedicated support SLA and hardware acceleration modules.',
      items: [
        {
          id: 'item_1',
          productId: 'prod_server_pro',
          productName: 'DealFlow Enterprise Cloud Server Node (Pro)',
          sku: 'DF-SRV-PRO-01',
          quantity: 4,
          unitPrice: '150000.00',
          discountPercent: '15.00',
          grossAmount: '600000.00',
          discountAmount: '90000.00',
          netAmount: '510000.00',
        },
        {
          id: 'item_2',
          productId: 'prod_license_tier3',
          productName: 'High-Volume Deal Governance License (Tier 3)',
          sku: 'DF-LIC-T3-ANNUAL',
          quantity: 20,
          unitPrice: '17058.82',
          discountPercent: '15.00',
          grossAmount: '341176.40',
          discountAmount: '51176.40',
          netAmount: '290000.00',
        },
      ],
      negotiationHistory: [
        {
          id: 'neg_1',
          quotationId: 'quote_1024',
          requestedBy: 'Vikram Mehta (Customer)',
          requestedRole: 'CUSTOMER',
          requestedDiscountPercent: 15,
          reason: 'We are expanding from 2 sites to 4 regional data centers and increasing overall license count.',
          changeRequests: ['Higher Volume Pricing', 'Faster SLA Guarantee'],
          status: 'APPROVED',
          approvals: [
            {
              level: 'SALES_MANAGER',
              status: 'APPROVED',
              approverName: 'Rajesh Kumar (Sales Director)',
              decidedAt: '2026-09-02T10:30:00Z',
              comments: 'Volume commitment verified. Approved 15% discount for Tier 3 node bundle.',
            },
            {
              level: 'FINANCE',
              status: 'APPROVED',
              approverName: 'Anita Desai (Finance Ops Lead)',
              decidedAt: '2026-09-02T14:15:00Z',
              comments: 'Gross deal margin remains healthy at 42%. Approved.',
            },
          ],
          createdAt: '2026-09-01T15:00:00Z',
        },
      ],
      approvalStatus: {
        overallStatus: 'APPROVED',
        steps: [
          {
            level: 'SALES_MANAGER',
            status: 'APPROVED',
            approverName: 'Rajesh Kumar (Sales Director)',
            decidedAt: '2026-09-02T10:30:00Z',
            comments: 'Approved 15% discount structure.',
          },
          {
            level: 'FINANCE',
            status: 'APPROVED',
            approverName: 'Anita Desai (Finance Ops Lead)',
            decidedAt: '2026-09-02T14:15:00Z',
            comments: 'Verified against financial margin guardrails.',
          },
        ],
      },
    },
    {
      id: 'quote_1023',
      quotationNumber: 'Q-1023',
      customerId: 'cust_abc_industries',
      customerName: 'ABC Industries Pvt. Ltd.',
      status: 'APPROVED',
      currency: 'INR',
      subtotal: '500000.00',
      discountAmount: '50000.00',
      discountPercent: 10,
      taxAmount: '81000.00',
      shippingAmount: '0.00',
      totalAmount: '450000.00',
      issueDate: '2026-08-25',
      expiryDate: '2026-09-25',
      notes: 'Initial CPQ integration package with 10 standard user seats.',
      items: [
        {
          id: 'item_3',
          productId: 'prod_cpq_std',
          productName: 'DealFlow360 Standard Seat Pack (10 Users)',
          sku: 'DF-SEAT-10-STD',
          quantity: 1,
          unitPrice: '500000.00',
          discountPercent: '10.00',
          grossAmount: '500000.00',
          discountAmount: '50000.00',
          netAmount: '450000.00',
        },
      ],
      negotiationHistory: [],
      approvalStatus: {
        overallStatus: 'APPROVED',
        steps: [
          {
            level: 'SALES_MANAGER',
            status: 'APPROVED',
            approverName: 'Rajesh Kumar',
            decidedAt: '2026-08-26T09:00:00Z',
            comments: 'Standard tier discount applied.',
          },
        ],
      },
    },
    {
      id: 'quote_1022',
      quotationNumber: 'Q-1022',
      customerId: 'cust_abc_industries',
      customerName: 'ABC Industries Pvt. Ltd.',
      status: 'EXPIRED',
      currency: 'INR',
      subtotal: '355555.55',
      discountAmount: '35555.55',
      discountPercent: 10,
      taxAmount: '57600.00',
      shippingAmount: '0.00',
      totalAmount: '320000.00',
      issueDate: '2026-07-01',
      expiryDate: '2026-07-31',
      notes: 'Previous quarter hardware migration proposal.',
      items: [
        {
          id: 'item_4',
          productId: 'prod_mig_hw',
          productName: 'Legacy System Data Migration Utility',
          sku: 'DF-MIG-UTIL',
          quantity: 1,
          unitPrice: '355555.55',
          discountPercent: '10.00',
          grossAmount: '355555.55',
          discountAmount: '35555.55',
          netAmount: '320000.00',
        },
      ],
      negotiationHistory: [],
      approvalStatus: {
        overallStatus: 'NOT_REQUIRED',
        steps: [],
      },
    },
  ],
  orders: [
    {
      id: 'ord_1002',
      orderNumber: 'ORD-1002',
      quotationId: 'quote_1023',
      quotationNumber: 'Q-1023',
      customerId: 'cust_abc_industries',
      customerName: 'ABC Industries Pvt. Ltd.',
      totalAmount: '450000.00',
      currency: 'INR',
      fulfillmentStatus: 'SHIPPED',
      paymentStatus: 'PAID',
      orderDate: '2026-08-28',
      estimatedDeliveryDate: '2026-09-08',
      carrier: 'Blue Dart Express Logistics',
      trackingNumber: 'BD-IN-88992147',
      warehouseName: 'North Zone Central Hub, Noida',
      items: [
        {
          id: 'item_3',
          productId: 'prod_cpq_std',
          productName: 'DealFlow360 Standard Seat Pack (10 Users)',
          sku: 'DF-SEAT-10-STD',
          quantity: 1,
          unitPrice: '500000.00',
          discountPercent: '10.00',
          grossAmount: '500000.00',
          discountAmount: '50000.00',
          netAmount: '450000.00',
        },
      ],
      timeline: [
        {
          stage: 'CONFIRMED',
          timestamp: '2026-08-28T11:00:00Z',
          completed: true,
          description: 'Quotation Q-1023 confirmed by customer and converted to order.',
        },
        {
          stage: 'PROCESSING',
          timestamp: '2026-08-29T09:30:00Z',
          completed: true,
          description: 'Order processed and inventory allocated at Noida distribution center.',
        },
        {
          stage: 'PACKED',
          timestamp: '2026-08-30T16:45:00Z',
          completed: true,
          description: 'Items packaged and security verification completed.',
        },
        {
          stage: 'SHIPPED',
          timestamp: '2026-08-31T08:15:00Z',
          completed: true,
          description: 'Dispatched via Blue Dart Express (Tracking: BD-IN-88992147).',
        },
        {
          stage: 'DELIVERED',
          timestamp: '',
          completed: false,
          description: 'Out for final delivery to customer premises.',
        },
      ],
    },
  ],
  invoices: [
    {
      id: 'inv_1002',
      invoiceNumber: 'INV-1002',
      orderId: 'ord_1002',
      orderNumber: 'ORD-1002',
      quotationNumber: 'Q-1023',
      customerId: 'cust_abc_industries',
      customerName: 'ABC Industries Pvt. Ltd.',
      issueDate: '2026-08-28',
      dueDate: '2026-09-28',
      subtotal: '500000.00',
      discountAmount: '50000.00',
      taxAmount: '81000.00',
      totalAmount: '450000.00',
      amountPaid: '450000.00',
      balanceDue: '0.00',
      currency: 'INR',
      status: 'PAID',
      items: [
        {
          id: 'item_3',
          productId: 'prod_cpq_std',
          productName: 'DealFlow360 Standard Seat Pack (10 Users)',
          sku: 'DF-SEAT-10-STD',
          quantity: 1,
          unitPrice: '500000.00',
          discountPercent: '10.00',
          grossAmount: '500000.00',
          discountAmount: '50000.00',
          netAmount: '450000.00',
        },
      ],
    },
  ],
  payments: [
    {
      id: 'pay_1001',
      paymentNumber: 'PAY-1001',
      invoiceId: 'inv_1002',
      invoiceNumber: 'INV-1002',
      orderNumber: 'ORD-1002',
      amount: '450000.00',
      currency: 'INR',
      paymentMethod: 'NET_BANKING',
      transactionReference: 'HDFC-TXN-998822114',
      status: 'SUCCESS',
      paidAt: '2026-08-29T14:20:00Z',
    },
  ],
  subscriptions: [
    {
      id: 'sub_101',
      planName: 'Enterprise SLA & Infrastructure Support',
      subscriptionNumber: 'SUB-2026-089',
      status: 'ACTIVE',
      recurringAmount: '25000.00',
      currency: 'INR',
      billingFrequency: 'MONTHLY',
      startDate: '2026-01-01',
      renewalDate: '2026-10-01',
      features: [
        '24/7 Dedicated Technical Account Manager',
        '15-Minute Critical Severity Response SLA',
        'Continuous Cloud Compliance & Deal Guardrails',
        'Automated Monthly Optimization Reports',
      ],
      oneTimeCharges: '0.00',
    },
  ],
  notifications: [
    {
      id: 'notif_1',
      title: 'Quotation Q-1024 Approved',
      message: 'Your counteroffer for 15% discount has been approved by Sales and Finance.',
      type: 'NEGOTIATION',
      isRead: false,
      createdAt: '2026-09-02T14:20:00Z',
      linkUrl: '/customer/quotations/quote_1024',
    },
    {
      id: 'notif_2',
      title: 'Shipment Dispatched: ORD-1002',
      message: 'Order ORD-1002 has shipped via Blue Dart with tracking BD-IN-88992147.',
      type: 'ORDER',
      isRead: false,
      createdAt: '2026-08-31T08:30:00Z',
      linkUrl: '/customer/orders/ord_1002',
    },
    {
      id: 'notif_3',
      title: 'Payment Received: INV-1002',
      message: 'Payment of ₹4,50,000.00 for invoice INV-1002 was successfully processed.',
      type: 'PAYMENT',
      isRead: true,
      createdAt: '2026-08-29T14:25:00Z',
      linkUrl: '/customer/payments',
    },
  ],
};

let store: CustomerPortalStore = JSON.parse(JSON.stringify(DEFAULT_STORE));

export class CustomerPortalRepository {
  async getDashboardMetrics(customerId?: string): Promise<CustomerDashboardMetrics> {
    const custQuotes = customerId
      ? store.quotations.filter((q) => !q.customerId || q.customerId === customerId || customerId === store.profile.id)
      : store.quotations;
    const custOrders = customerId
      ? store.orders.filter((o) => !o.customerId || o.customerId === customerId || customerId === store.profile.id)
      : store.orders;
    const custInvoices = customerId
      ? store.invoices.filter((i) => !i.customerId || i.customerId === customerId || customerId === store.profile.id)
      : store.invoices;

    const activeQuotations = custQuotes.filter(
      (q) => q.status === 'APPROVED' || q.status === 'DRAFT' || q.status === 'NEGOTIATION'
    ).length;

    const pendingNegotiations = store.quotations.filter(
      (q) => q.status === 'NEGOTIATION' || q.status === 'PENDING_APPROVAL'
    ).length;

    const confirmedOrders = store.orders.length;

    const outstandingInvoices = store.invoices.filter(
      (inv) => inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'OVERDUE'
    ).length;

    const recentQuotations = store.quotations.slice(0, 5).map((q) => ({
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

    const recentActivity = [
      ...store.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.message,
        timestamp: n.createdAt,
        type: n.type.toLowerCase() as any,
      })),
    ].slice(0, 6);

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

  async findQuotations(
    query?: { search?: string; status?: string },
    customerId?: string
  ): Promise<CustomerQuotationDetail[]> {
    let result = [...store.quotations];

    if (customerId) {
      result = result.filter(
        (q) => !q.customerId || q.customerId === customerId || customerId === store.profile.id
      );
    }

    if (query?.status && query.status !== 'ALL') {
      result = result.filter((q) => q.status.toUpperCase() === query.status?.toUpperCase());
    }

    if (query?.search) {
      const s = query.search.toLowerCase();
      result = result.filter(
        (q) =>
          q.quotationNumber.toLowerCase().includes(s) ||
          q.notes?.toLowerCase().includes(s) ||
          q.items.some((i) => i.productName.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s))
      );
    }

    return result;
  }

  async findQuotationById(id: string, customerId?: string): Promise<CustomerQuotationDetail | undefined> {
    const quote = store.quotations.find((q) => q.id === id || q.quotationNumber === id);
    if (!quote) return undefined;
    if (customerId && quote.customerId && quote.customerId !== customerId && customerId !== store.profile.id) {
      return undefined; // Not authorized for this customer
    }
    return quote;
  }

  async submitNegotiation(
    quotationId: string,
    data: {
      requestedDiscountPercent: number;
      reason: string;
      changeRequests?: string[];
      message?: string;
    },
    customerId?: string
  ): Promise<CustomerQuotationDetail> {
    const quote = await this.findQuotationById(quotationId, customerId);
    if (!quote) {
      throw new Error(`Quotation with ID '${quotationId}' not found or access denied`);
    }

    const requestedDiscount = data.requestedDiscountPercent;
    let newStatus: 'NEGOTIATION' | 'PENDING_APPROVAL' | 'APPROVED' = 'NEGOTIATION';
    const approvalSteps: Array<{
      level: 'SALES_MANAGER' | 'FINANCE';
      status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
      approverName?: string;
      decidedAt?: string;
      comments?: string;
    }> = [];

    // Discount Governance Workflow Engine:
    // <= 10%: Auto approved by standard tier
    // 10% - 20%: Requires Sales Manager approval
    // > 20%: Requires Sales Manager + Finance Lead approval
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
        approverName: 'Rajesh Kumar (Sales Director)',
        comments: 'Pending Sales Manager review for discount between 10% and 20%.',
      });
    } else {
      newStatus = 'PENDING_APPROVAL';
      approvalSteps.push(
        {
          level: 'SALES_MANAGER',
          status: 'PENDING',
          approverName: 'Rajesh Kumar (Sales Director)',
          comments: 'Tier 1 Approval Required for high discount request (>20%).',
        },
        {
          level: 'FINANCE',
          status: 'PENDING',
          approverName: 'Anita Desai (Finance Ops Lead)',
          comments: 'Tier 2 Financial Margin & Profitability Review Required.',
        }
      );
    }

    const subtotalNum = parseFloat(quote.subtotal) || 0;
    const newDiscountAmount = ((subtotalNum * requestedDiscount) / 100).toFixed(2);
    const newTotal = (subtotalNum - parseFloat(newDiscountAmount)).toFixed(2);

    const newHistoryEntry: NegotiationHistoryEntry = {
      id: `neg_${Date.now()}`,
      quotationId: quote.id,
      requestedBy: store.profile.contactName,
      requestedRole: 'CUSTOMER',
      requestedDiscountPercent: requestedDiscount,
      reason: data.reason || data.message || 'Customer requested commercial discount adjustment.',
      changeRequests: data.changeRequests,
      status: newStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
      approvals: approvalSteps,
      comments: data.message,
      createdAt: new Date().toISOString(),
    };

    quote.status = newStatus;
    quote.discountPercent = requestedDiscount;
    quote.discountAmount = newDiscountAmount;
    quote.totalAmount = newTotal;
    quote.negotiationHistory.unshift(newHistoryEntry);
    quote.approvalStatus = {
      overallStatus: newStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
      steps: approvalSteps,
    };

    // Add notification
    store.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: `Negotiation Submitted for ${quote.quotationNumber}`,
      message: `Your request for ${requestedDiscount}% discount has been submitted to Sales Governance.`,
      type: 'NEGOTIATION',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: `/customer/quotations/${quote.id}`,
    });

    return quote;
  }

  async confirmQuotation(
    quotationId: string,
    customerId?: string
  ): Promise<{ quotation: CustomerQuotationDetail; order: CustomerOrder }> {
    const quote = await this.findQuotationById(quotationId, customerId);
    if (!quote) {
      throw new Error(`Quotation with ID '${quotationId}' not found or access denied`);
    }

    quote.status = 'CONFIRMED';

    const orderNum = `ORD-${quote.quotationNumber.replace('Q-', '')}`;
    const orderId = `ord_${Date.now()}`;

    quote.orderId = orderId;
    quote.orderNumber = orderNum;

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
      carrier: 'Blue Dart Logistics Express',
      trackingNumber: `BD-IN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      warehouseName: 'North Zone Central Hub, Noida',
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
          description: 'Warehouse inventory reservation initiated.',
        },
        {
          stage: 'PACKED',
          timestamp: '',
          completed: false,
          description: 'Pending pick & pack verification.',
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
          description: 'Delivery to destination.',
        },
      ],
    };

    store.orders.unshift(newOrder);

    // Also automatically create corresponding invoice for the order
    const invoiceId = `inv_${Date.now()}`;
    const invoiceNum = `INV-${quote.quotationNumber.replace('Q-', '')}`;
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

    // Notify customer
    store.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: `Order Created: ${newOrder.orderNumber}`,
      message: `Quotation ${quote.quotationNumber} has been converted to Order ${newOrder.orderNumber}.`,
      type: 'ORDER',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: `/customer/orders/${newOrder.id}`,
    });

    return { quotation: quote, order: newOrder };
  }

  async findOrders(customerId?: string): Promise<CustomerOrder[]> {
    if (customerId) {
      return store.orders.filter(
        (o) => !o.customerId || o.customerId === customerId || customerId === store.profile.id
      );
    }
    return store.orders;
  }

  async findOrderById(id: string, customerId?: string): Promise<CustomerOrder | undefined> {
    const order = store.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return undefined;
    if (customerId && order.customerId && order.customerId !== customerId && customerId !== store.profile.id) {
      return undefined;
    }
    return order;
  }

  async findInvoices(customerId?: string): Promise<CustomerInvoice[]> {
    if (customerId) {
      return store.invoices.filter(
        (inv) => !inv.customerId || inv.customerId === customerId || customerId === store.profile.id
      );
    }
    return store.invoices;
  }

  async findInvoiceById(id: string, customerId?: string): Promise<CustomerInvoice | undefined> {
    const invoice = store.invoices.find((inv) => inv.id === id || inv.invoiceNumber === id);
    if (!invoice) return undefined;
    if (customerId && invoice.customerId && invoice.customerId !== customerId && customerId !== store.profile.id) {
      return undefined;
    }
    return invoice;
  }

  async payInvoice(
    invoiceId: string,
    data: { amount: string; paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI' },
    customerId?: string
  ): Promise<{ invoice: CustomerInvoice; payment: CustomerPayment }> {
    const invoice = await this.findInvoiceById(invoiceId, customerId);
    if (!invoice) {
      throw new Error(`Invoice with ID '${invoiceId}' not found or access denied`);
    }

    const payAmount = parseFloat(data.amount) || parseFloat(invoice.balanceDue);
    const newPaid = (parseFloat(invoice.amountPaid) + payAmount).toFixed(2);
    const newBalance = Math.max(0, parseFloat(invoice.totalAmount) - parseFloat(newPaid)).toFixed(2);

    invoice.amountPaid = newPaid;
    invoice.balanceDue = newBalance;
    invoice.status = parseFloat(newBalance) <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    // Update corresponding order payment status
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

  async findPayments(customerId?: string): Promise<CustomerPayment[]> {
    if (customerId) {
      return store.payments.filter((_p) => true);
    }
    return store.payments;
  }

  async findSubscriptions(customerId?: string): Promise<CustomerSubscription[]> {
    if (customerId) {
      return store.subscriptions.filter(
        (s) => !s.customerId || s.customerId === customerId || customerId === store.profile.id
      );
    }
    return store.subscriptions;
  }

  async findSubscriptionById(id: string, customerId?: string): Promise<CustomerSubscription | undefined> {
    const sub = store.subscriptions.find((s) => s.id === id);
    if (!sub) return undefined;
    if (customerId && sub.customerId && sub.customerId !== customerId && customerId !== store.profile.id) {
      return undefined;
    }
    return sub;
  }

  async findNotifications(_customerId?: string): Promise<CustomerNotification[]> {
    return store.notifications;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notif = store.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      return true;
    }
    return false;
  }

  async markAllNotificationsAsRead(): Promise<boolean> {
    store.notifications.forEach((n) => {
      n.isRead = true;
    });
    return true;
  }

  async getProfile(_customerId?: string): Promise<CustomerProfile> {
    return store.profile;
  }

  async updateProfile(data: Partial<CustomerProfile>, _customerId?: string): Promise<CustomerProfile> {
    store.profile = {
      ...store.profile,
      ...data,
    };
    return store.profile;
  }
}

export const customerPortalRepository = new CustomerPortalRepository();
