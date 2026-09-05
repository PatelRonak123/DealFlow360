export interface CustomerDashboardMetrics {
  activeQuotations: number;
  pendingNegotiations: number;
  confirmedOrders: number;
  outstandingInvoices: number;
  recentQuotations: Array<{
    id: string;
    quotationNumber: string;
    totalAmount: string;
    status: string;
    currency: string;
    expiryDate: string;
    issueDate: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    quotationNumber: string;
    totalAmount: string;
    fulfillmentStatus: string;
    paymentStatus: string;
    orderDate: string;
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'quotation' | 'order' | 'invoice' | 'payment' | 'negotiation';
  }>;
}

export interface CustomerQuotationItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  discountPercent: string;
  grossAmount: string;
  discountAmount: string;
  netAmount: string;
}

export interface ApprovalStep {
  level: 'SALES_MANAGER' | 'FINANCE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
  approverName?: string;
  decidedAt?: string;
  comments?: string;
}

export interface NegotiationHistoryEntry {
  id: string;
  quotationId: string;
  requestedBy: string;
  requestedRole: string;
  requestedDiscountPercent: number;
  reason: string;
  changeRequests?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  approvals: ApprovalStep[];
  comments?: string;
  createdAt: string;
}

export interface CustomerQuotationDetail {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'NEGOTIATION' | 'REJECTED' | 'EXPIRED' | 'CONFIRMED';
  currency: string;
  subtotal: string;
  discountAmount: string;
  discountPercent: number;
  taxAmount: string;
  shippingAmount: string;
  totalAmount: string;
  issueDate: string;
  expiryDate: string;
  notes?: string;
  items: CustomerQuotationItem[];
  negotiationHistory: NegotiationHistoryEntry[];
  approvalStatus: {
    overallStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
    steps: ApprovalStep[];
  };
  orderId?: string;
  orderNumber?: string;
}

export interface NegotiationSubmissionInput {
  requestedDiscountPercent: number;
  reason: string;
  changeRequests?: string[];
  message?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  quotationId: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  totalAmount: string;
  currency: string;
  fulfillmentStatus: 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  orderDate: string;
  estimatedDeliveryDate?: string;
  carrier?: string;
  trackingNumber?: string;
  warehouseName?: string;
  items: CustomerQuotationItem[];
  timeline: Array<{
    stage: 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED';
    timestamp: string;
    completed: boolean;
    description: string;
  }>;
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  currency: string;
  status: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: CustomerQuotationItem[];
}

export interface CustomerPayment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  orderNumber: string;
  amount: string;
  currency: string;
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_BANKING' | 'UPI';
  transactionReference: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  paidAt: string;
}

export interface CustomerSubscription {
  id: string;
  planName: string;
  subscriptionNumber: string;
  status: 'ACTIVE' | 'PENDING_RENEWAL' | 'PAST_DUE' | 'CANCELLED';
  recurringAmount: string;
  currency: string;
  billingFrequency: 'MONTHLY' | 'ANNUAL';
  startDate: string;
  renewalDate: string;
  features: string[];
  oneTimeCharges?: string;
}

export interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: 'QUOTATION' | 'NEGOTIATION' | 'ORDER' | 'INVOICE' | 'PAYMENT' | 'SUBSCRIPTION';
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface CustomerProfile {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  tierName: string;
  taxId?: string;
}
