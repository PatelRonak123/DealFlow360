import { DbClient } from '../../../database/db.js';
import { InventoryRepository } from '../../inventory/repositories/inventory.repository.js';
import {
  AllocationItemPlan,
  BackorderItemPlan,
  AllocationPlanResult,
} from '../types/index.js';
import { FulfillmentStatus } from '../constants/index.js';

export interface QuotationItemForAllocation {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

export class InventoryAllocationService {
  constructor(private inventoryRepo: InventoryRepository) {}

  async calculateAllocationPlan(
    quotationId: string,
    items: QuotationItemForAllocation[],
    tx?: DbClient
  ): Promise<AllocationPlanResult> {
    const allocations: AllocationItemPlan[] = [];
    const backorders: BackorderItemPlan[] = [];

    for (const item of items) {
      const requiredQty = item.quantity;
      if (requiredQty <= 0) continue;

      // Get inventory for product across active warehouses
      const inventoryList = await this.inventoryRepo.findByProductId(
        item.productId,
        tx
      );

      // Compute available quantity per warehouse
      const candidates = inventoryList
        .map((record) => ({
          warehouseId: record.warehouse.id,
          warehouseName: record.warehouse.name,
          warehouseCode: record.warehouse.code,
          priority: record.warehouse.priority,
          availableQuantity: Math.max(
            0,
            record.inventory.quantityOnHand - record.inventory.reservedQuantity
          ),
        }))
        .filter((c) => c.availableQuantity > 0)
        .sort((a, b) => {
          // Sort by availableQuantity DESC, priority DESC, code ASC
          if (b.availableQuantity !== a.availableQuantity) {
            return b.availableQuantity - a.availableQuantity;
          }
          if (b.priority !== a.priority) {
            return b.priority - a.priority;
          }
          return a.warehouseCode.localeCompare(b.warehouseCode);
        });

      // Priority 1: Check if any single warehouse can fulfill 100% of required quantity
      const singleWarehouse = candidates.find(
        (c) => c.availableQuantity >= requiredQty
      );

      if (singleWarehouse) {
        allocations.push({
          warehouseId: singleWarehouse.warehouseId,
          warehouseName: singleWarehouse.warehouseName,
          warehouseCode: singleWarehouse.warehouseCode,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          allocatedQuantity: requiredQty,
        });
        continue;
      }

      // Priority 2: Multi-warehouse split allocation
      let remainingQty = requiredQty;
      let totalAllocatedForItem = 0;

      for (const candidate of candidates) {
        if (remainingQty <= 0) break;

        const allocQty = Math.min(candidate.availableQuantity, remainingQty);
        if (allocQty > 0) {
          allocations.push({
            warehouseId: candidate.warehouseId,
            warehouseName: candidate.warehouseName,
            warehouseCode: candidate.warehouseCode,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            allocatedQuantity: allocQty,
          });
          remainingQty -= allocQty;
          totalAllocatedForItem += allocQty;
        }
      }

      // Priority 3: Backorder for remaining shortage
      if (remainingQty > 0) {
        backorders.push({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          requiredQuantity: requiredQty,
          allocatedQuantity: totalAllocatedForItem,
          backorderedQuantity: remainingQty,
        });
      }
    }

    const hasBackorders = backorders.some((b) => b.backorderedQuantity > 0);
    const isFullyAllocatable = !hasBackorders;
    const status = isFullyAllocatable
      ? FulfillmentStatus.ALLOCATED
      : FulfillmentStatus.PARTIALLY_ALLOCATED;

    return {
      quotationId,
      isFullyAllocatable,
      status,
      allocations,
      backorders,
    };
  }
}
