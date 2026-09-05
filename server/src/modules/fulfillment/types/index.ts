import { FulfillmentStatusType } from '../constants/index.js';

export interface AllocationItemPlan {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productName: string;
  sku: string;
  allocatedQuantity: number;
}

export interface BackorderItemPlan {
  productId: string;
  productName: string;
  sku: string;
  requiredQuantity: number;
  allocatedQuantity: number;
  backorderedQuantity: number;
}

export interface AllocationPlanResult {
  quotationId: string;
  isFullyAllocatable: boolean;
  status: FulfillmentStatusType;
  allocations: AllocationItemPlan[];
  backorders: BackorderItemPlan[];
}

export interface ManualAllocationItem {
  warehouseId: string;
  productId: string;
  quantity: number;
}

export interface OverrideAllocationsInput {
  allocations: ManualAllocationItem[];
}

export interface FulfillItemsInput {
  items?: Array<{
    allocationId: string;
    quantity: number;
  }>;
  notes?: string;
}

export interface CancelFulfillmentInput {
  reason: string;
}

export interface ListFulfillmentsQuery {
  page?: number;
  limit?: number;
  status?: string;
  quotationId?: string;
  search?: string;
}
