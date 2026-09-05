import { CustomerTier } from '@/features/customers/types/Customer';
import { QuotationLineItem, GovernanceLevel, ApprovalStep } from '../types/Quotation';
import { Product } from '@/features/products/types/Product';

export function calculateLineItem(
  product: Product,
  quantity: number,
  discountPercent: number
): QuotationLineItem {
  const safeDiscount = Math.max(0, Math.min(100, discountPercent));
  const discountMultiplier = (100 - safeDiscount) / 100;
  const lineTotal = Math.round(product.basePrice * quantity * discountMultiplier);
  const lineCost = Math.round(product.costPrice * quantity);
  const lineProfit = lineTotal - lineCost;
  const lineMarginPercent = lineTotal > 0 ? (lineProfit / lineTotal) * 100 : 0;

  // Split warehouse allocations based on available stock
  const allocations = product.warehouses.map((wh) => {
    const allocated = Math.min(wh.availableStock, Math.ceil(quantity / product.warehouses.length));
    return {
      warehouseId: wh.warehouseId,
      warehouseName: wh.warehouseName,
      city: wh.city,
      quantity: allocated,
    };
  });

  return {
    id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    billingType: product.billingType,
    billingPeriod: product.billingPeriod,
    unitPrice: product.basePrice,
    costPrice: product.costPrice,
    quantity,
    discountPercent: safeDiscount,
    lineTotal,
    lineCost,
    lineMarginPercent,
    discountCeiling: product.discountCeilingPercent,
    isDiscountExceeded: safeDiscount > product.discountCeilingPercent,
    warehouseAllocations: allocations,
  };
}

export function evaluateFinancialsAndGovernance(
  lineItems: QuotationLineItem[],
  customerTier: CustomerTier,
  paymentTerms: string = 'Net 30'
) {
  let oneTimeSubtotal = 0;
  let recurringARRSubtotal = 0;
  let grossTotal = 0;
  let netTotal = 0;
  let totalCost = 0;

  lineItems.forEach((item) => {
    const grossLine = item.unitPrice * item.quantity;
    grossTotal += grossLine;
    netTotal += item.lineTotal;
    totalCost += item.lineCost;

    if (item.billingType === 'one_time') {
      oneTimeSubtotal += item.lineTotal;
    } else {
      // Annualized ARR
      const arr = item.billingPeriod === 'monthly' ? item.lineTotal * 12 : item.lineTotal;
      recurringARRSubtotal += arr;
    }
  });

  const totalDiscountAmount = grossTotal - netTotal;
  const averageDiscountPercent = grossTotal > 0 ? (totalDiscountAmount / grossTotal) * 100 : 0;
  const grossProfit = netTotal - totalCost;
  const grossMarginPercent = netTotal > 0 ? (grossProfit / netTotal) * 100 : 0;

  // Evaluate Governance Rules
  const reasons: string[] = [];
  let requiresManager = false;
  let requiresFinance = false;

  // Customer tier limits
  const tierAllowances: Record<CustomerTier, number> = {
    Gold: 20,
    Silver: 15,
    Bronze: 10,
  };
  const maxTierAllowed = tierAllowances[customerTier] || 10;

  // Rule 1: Customer Tier Allowance check
  if (averageDiscountPercent > maxTierAllowed) {
    requiresManager = true;
    reasons.push(
      `Overall discount (${averageDiscountPercent.toFixed(1)}%) exceeds ${customerTier} tier allowance of ${maxTierAllowed}%.`
    );
  }

  // Rule 2: Category Ceiling violations
  const exceededItems = lineItems.filter((i) => i.discountPercent > i.discountCeiling);
  if (exceededItems.length > 0) {
    requiresManager = true;
    exceededItems.forEach((i) => {
      reasons.push(
        `${i.name} discount (${i.discountPercent}%) exceeds ${i.category.replace('_', ' ')} ceiling of ${i.discountCeiling}%.`
      );
    });
  }

  // Rule 3: High discount escalation to Finance
  if (averageDiscountPercent > 22) {
    requiresFinance = true;
    reasons.push(`Total discount exceeds 22% executive ceiling - Finance Approval is required.`);
  }

  // Rule 4: Margin degradation
  if (grossMarginPercent < 20) {
    requiresFinance = true;
    reasons.push(
      `Gross margin (${grossMarginPercent.toFixed(1)}%) is under critical 20% floor - Finance Approval is required.`
    );
  } else if (grossMarginPercent < 30) {
    requiresManager = true;
    reasons.push(
      `Gross margin (${grossMarginPercent.toFixed(1)}%) is under standard 30% target.`
    );
  }

  // Rule 5: Extended payment terms
  if (paymentTerms === 'Net 60' && customerTier !== 'Gold') {
    requiresFinance = true;
    reasons.push(`Net 60 payment terms for non-Gold tier requires Finance signoff.`);
  }

  let governanceLevel: GovernanceLevel = 'auto_approved';
  const approvalChain: ApprovalStep[] = [];

  if (requiresFinance) {
    governanceLevel = 'requires_manager_and_finance';
    approvalChain.push({
      role: 'Sales Manager',
      approver: 'Vikram Mehta',
      status: 'pending',
    });
    approvalChain.push({
      role: 'Finance & Ops',
      approver: 'Ananya Iyer',
      status: 'pending',
    });
  } else if (requiresManager) {
    governanceLevel = 'requires_manager';
    approvalChain.push({
      role: 'Sales Manager',
      approver: 'Vikram Mehta',
      status: 'pending',
    });
  }

  return {
    oneTimeSubtotal,
    recurringARRSubtotal,
    grossTotal,
    netTotal,
    totalDiscountAmount,
    averageDiscountPercent,
    totalCost,
    grossProfit,
    grossMarginPercent,
    governanceLevel,
    governanceReasons: reasons,
    approvalChain,
  };
}
