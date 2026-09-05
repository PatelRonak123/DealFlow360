export type BackendQuotationStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER_APPROVAL'
  | 'PENDING_FINANCE_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT'
  | 'CANCELLED'
  | 'EXPIRED';

export interface BackendCustomerSummary {
  id: string;
  companyName: string;
  contactName?: string | null;
  email: string;
  phone?: string | null;
  customerTierId?: string | null;
  status: string;
  customerTier?: {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
  } | null;
}

export interface BackendProductSummary {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  categoryId: string;
  productType: 'ONE_TIME' | 'RECURRING' | 'SERVICE';
  basePrice: string | number;
  currency: string;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface BackendPriceListSummary {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface BackendQuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: string | number;
  discountPercent: string | number;
  grossAmount: string | number;
  discountAmount: string | number;
  netAmount: string | number;
  createdAt: string;
  updatedAt: string;
  product?: BackendProductSummary;
}

export interface BackendQuotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  priceListId: string;
  status: BackendQuotationStatus;
  currency: string;
  subtotal: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  issueDate: string;
  expiryDate: string;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: BackendCustomerSummary;
  priceList?: BackendPriceListSummary;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  items?: BackendQuotationItem[];
}

export interface CreateQuotationItemPayload {
  productId: string;
  quantity: number;
  discountPercent?: number | string;
}

export interface CreateQuotationPayload {
  customerId: string;
  priceListId: string;
  issueDate: string;
  expiryDate: string;
  notes?: string | null;
  currency?: string;
  items?: CreateQuotationItemPayload[];
  submitForApproval?: boolean;
  submitNotes?: string;
}

export interface UpdateQuotationPayload {
  customerId?: string;
  priceListId?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string | null;
  status?: BackendQuotationStatus;
}

export interface AddQuotationItemPayload {
  productId: string;
  quantity: number;
  discountPercent?: number | string;
}

export interface UpdateQuotationItemPayload {
  quantity?: number;
  discountPercent?: number | string;
}

export interface SubmitQuotationPayload {
  notes?: string;
}

export interface QuotationApprovalItem {
  id: string;
  quotationId: string;
  approvalLevel: 'MANAGER' | 'FINANCE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVALIDATED';
  sequence: number;
  requestedAt?: string;
  decidedAt?: string | null;
  decidedById?: string | null;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LineDiscountEvaluationDetail {
  quotationItemId: string;
  productId: string;
  productName: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  appliedDiscount: number;
  customerTierLimit: number;
  categoryLimit: number;
  effectiveAllowedDiscount: number;
  excessDiscount: number;
  isViolation: boolean;
  riskContribution: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
}

export interface QuotationDiscountEvaluation {
  quotationId: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerTierId: string | null;
  customerTierName: string | null;
  subtotalAmount: number;
  totalDiscountAmount: number;
  totalAmount: number;
  totalViolations: number;
  riskScore: number;
  weightedExcessRisk: number;
  approvalRequired: boolean;
  approvalRoute: 'NO_APPROVAL' | 'MANAGER' | 'MANAGER_AND_FINANCE';
  requiredApprovalLevels: Array<'MANAGER' | 'FINANCE'>;
  lineEvaluations: LineDiscountEvaluationDetail[];
}

export interface QuotationSubmissionResult {
  quotationId: string;
  quotationNumber: string;
  status: BackendQuotationStatus;
  riskScore: number;
  totalViolations: number;
  approvalRequired: boolean;
  approvalRoute: string;
  evaluation: QuotationDiscountEvaluation;
  approvals: Array<{
    id: string;
    approvalLevel: string;
    status: string;
    sequence: number;
  }>;
}

export interface QuotationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BackendQuotationStatus | string;
  customerId?: string;
}
