import { CustomerTier } from '@/features/customers/types/Customer';
import { ProductCategory, ProductBillingType, BillingPeriod } from '@/features/products/types/Product';

export interface QuotationWarehouseAllocation {
  warehouseId: string;
  warehouseName: string;
  city: string;
  quantity: number;
}

export interface QuotationLineItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  category: ProductCategory;
  billingType: ProductBillingType;
  billingPeriod?: BillingPeriod;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discountPercent: number;
  lineTotal: number;
  lineCost: number;
  lineMarginPercent: number;
  discountCeiling: number;
  isDiscountExceeded: boolean;
  warehouseAllocations: QuotationWarehouseAllocation[];
}

export type GovernanceLevel =
  | 'auto_approved'
  | 'requires_manager'
  | 'requires_manager_and_finance';

export type QuoteApprovalStatus =
  | 'draft'
  | 'pending_manager'
  | 'pending_finance'
  | 'approved'
  | 'rejected';

export type QuoteLifecycleStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'in_negotiation'
  | 'under_reapproval'
  | 'closed_won'
  | 'rejected';

export interface ApprovalStep {
  role: 'Sales Manager' | 'Finance & Ops';
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comments?: string;
}

export interface WarehouseFulfillmentRecord {
  warehouseId: string;
  warehouseName: string;
  city: string;
  itemsCount: number;
  status: 'reserved' | 'ready_for_dispatch' | 'dispatched';
}

export interface BillingMilestone {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  status: 'pending' | 'invoiced' | 'paid';
  dueDate: string;
}

export interface NegotiationEntry {
  id: string;
  date: string;
  requestedDiscountPercent: number;
  notes: string;
  requiresReapproval: boolean;
  status: 'proposed' | 'approved' | 'applied' | 'rejected';
}

export interface Quotation {
  id: string;
  dealId?: string;
  dealTitle?: string;
  customerId: string;
  customerName: string;
  customerTier: CustomerTier;
  createdAt: string;
  validUntil: string;
  salesRepName: string;
  paymentTerms: 'Net 30' | 'Net 45' | 'Net 60';
  status: QuoteLifecycleStatus;
  
  // Line items
  lineItems: QuotationLineItem[];
  
  // Computed Financials
  oneTimeSubtotal: number;
  recurringARRSubtotal: number;
  grossTotal: number;
  netTotal: number;
  totalDiscountAmount: number;
  averageDiscountPercent: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  
  // Governance
  governanceLevel: GovernanceLevel;
  governanceReasons: string[];
  approvalChain: ApprovalStep[];
  
  // Fulfillment
  fulfillmentStatus: 'allocation_pending' | 'stock_allocated' | 'ready_to_dispatch' | 'dispatched';
  warehouses: WarehouseFulfillmentRecord[];
  
  // Billing
  billingMilestones: BillingMilestone[];
  
  // Negotiation & Re-approval
  negotiationEntries: NegotiationEntry[];
}
