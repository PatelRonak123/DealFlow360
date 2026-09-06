export interface ApprovedQuotationData {
  id: string;
  quotationNumber: string;
  customerId: string;
  priceListId?: string;
  status: string;
  currency: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  issueDate: string;
  expiryDate: string;
  notes?: string | null;
  createdAt: string;
  customer?: {
    id: string;
    companyName: string;
    email: string;
    contactName?: string | null;
  };
  hasInvoice: boolean;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: string;
    balanceDue: string;
  } | null;
}

export interface FinanceDashboardData {
  overview: {
    pendingFinanceApprovals: number;
    pendingFinanceValue: number;
    approvedDealsCount: number;
    rejectedDealsCount: number;
    approvedAwaitingInvoiceCount?: number;
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    overdueAmount: number;
    pendingInvoicesCount: number;
    paidInvoicesCount: number;
    overdueInvoicesCount: number;
    activeSubscriptionPlans: number;
  };
  arAging: {
    current: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  recentInvoices: InvoiceItemData[];
  recentPayments: PaymentItemData[];
  recentApprovals: any[];
  approvedQuotationsAwaitingInvoice?: ApprovedQuotationData[];
}

export interface InvoiceItemData {
  id: string;
  invoiceNumber: string;
  quotationId?: string | null;
  customerId: string;
  orderNumber?: string | null;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  currency: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  amountPaid: string;
  balanceDue: string;
  issueDate: string;
  dueDate: string;
  notes?: string | null;
  createdAt: string;
  customer?: {
    id: string;
    companyName: string;
    email: string;
    contactName?: string | null;
    phone?: string | null;
  };
  quotation?: {
    id: string;
    quotationNumber: string;
    totalAmount: string;
  } | null;
  items?: Array<{
    id: string;
    productId: string;
    productNameSnapshot: string;
    skuSnapshot: string;
    quantity: number;
    unitPrice: string;
    discountPercent: string;
    grossAmount: string;
    discountAmount: string;
    netAmount: string;
  }>;
  payments?: PaymentItemData[];
}

export interface PaymentItemData {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerId: string;
  amount: string;
  currency: string;
  paymentMethod: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'NET_BANKING' | 'UPI';
  transactionReference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  notes?: string | null;
  paidAt: string;
  createdAt: string;
  customer?: {
    id: string;
    companyName: string;
    email: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    amountPaid: string;
    balanceDue: string;
    status: string;
  };
}

export interface FinancialDealReviewData {
  approvalId?: string;
  currentApprovalLevel: string;
  approvalStatus: string;
  quotation: {
    id: string;
    quotationNumber: string;
    status: string;
    currency: string;
    subtotal: string;
    discountAmount: string;
    totalAmount: string;
    issueDate: string;
    expiryDate: string;
    notes?: string;
    createdAt: string;
  };
  customer: {
    id: string;
    companyName: string;
    contactName?: string;
    email: string;
    phone?: string;
    tierName: string;
    defaultDiscountLimit: string;
  };
  createdBy: {
    id: string;
    name: string;
    email?: string;
  };
  financialSummary: {
    totalGrossRevenue: string;
    totalDiscountGiven: string;
    overallDiscountPercent: string;
    totalNetRevenue: string;
    totalEstimatedCost: string;
    totalGrossProfit: string;
    overallMarginPercent: string;
    totalRiskScore: string;
    violationCount: number;
    marginFloorCompliant: boolean;
  };
  lineItems: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    category: string;
    quantity: number;
    unitPrice: string;
    discountPercent: string;
    grossAmount: string;
    discountAmount: string;
    netAmount: string;
    estimatedUnitCost: string;
    estimatedTotalCost: string;
    grossProfit: string;
    marginPercent: string;
    evaluation?: {
      effectiveAllowedDiscount: string;
      excessDiscount: string;
      isViolation: boolean;
      riskContribution: string;
    } | null;
  }>;
  approvalHistory: Array<{
    id: string;
    approvalLevel: string;
    status: string;
    sequence: number;
    requestedAt: string;
    decidedAt?: string | null;
    comments?: string | null;
    decidedBy?: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
}
