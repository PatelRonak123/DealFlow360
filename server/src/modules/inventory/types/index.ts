export interface AdjustStockInput {
  warehouseId: string;
  productId: string;
  quantity: number; // positive to add stock, negative to reduce
  transactionType?: 'STOCK_RECEIVED' | 'STOCK_ADJUSTED';
  referenceType?: string;
  referenceId?: string | null;
  notes?: string | null;
}

export interface SetStockInput {
  warehouseId: string;
  productId: string;
  quantityOnHand: number;
  reorderLevel?: number;
}

export interface ListInventoryQuery {
  page?: number;
  limit?: number;
  warehouseId?: string;
  productId?: string;
  search?: string;
  lowStock?: boolean;
}

export interface WarehouseStockDetail {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  priority: number;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface ProductInventorySummary {
  productId: string;
  productName: string;
  sku: string;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  warehouses: WarehouseStockDetail[];
}
