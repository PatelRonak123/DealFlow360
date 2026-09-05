import { eq } from 'drizzle-orm';
import { db } from '../../../database/db.js';
import { backorders } from '../../../database/schema/backorders.js';
import { FulfillmentRepository } from '../repositories/fulfillment.repository.js';
import { InventoryAllocationService } from './inventoryAllocation.service.js';
import { InventoryReservationService } from './inventoryReservation.service.js';
import { QuotationsRepository } from '../../quotations/repositories/quotations.repository.js';
import {
  OverrideAllocationsInput,
  FulfillItemsInput,
  ListFulfillmentsQuery,
} from '../types/index.js';
import {
  FulfillmentStatus,
  AllocationStatus,
  BackorderStatus,
} from '../constants/index.js';
import { NotFoundError, BadRequestError } from '../../../common/errors/index.js';

export class FulfillmentService {
  constructor(
    private fulfillmentRepo: FulfillmentRepository,
    private allocationService: InventoryAllocationService,
    private reservationService: InventoryReservationService,
    private quotationRepo: QuotationsRepository
  ) {}

  private generateFulfillmentNumber(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `FUL-${today}-${rand}`;
  }

  async previewAllocation(quotationId: string) {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    const quotationItems = (quotation.items || []).map((item) => ({
      productId: item.productId,
      productName: item.product?.name || item.productNameSnapshot || 'Product',
      sku: item.product?.sku || item.skuSnapshot || '',
      quantity: item.quantity,
    }));

    return this.allocationService.calculateAllocationPlan(
      quotationId,
      quotationItems
    );
  }

  async createFulfillment(quotationId: string, userId: string) {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    if (quotation.status !== 'APPROVED') {
      throw new BadRequestError(
        `Only APPROVED quotations can enter fulfillment. Current status: ${quotation.status}`
      );
    }

    const activeFulfillment = await this.fulfillmentRepo.findActiveByQuotationId(
      quotationId
    );
    if (activeFulfillment) {
      throw new BadRequestError(
        `An active fulfillment (${activeFulfillment.fulfillmentNumber}) already exists for this quotation`
      );
    }

    const quotationItems = (quotation.items || []).map((item) => ({
      productId: item.productId,
      productName: item.product?.name || item.productNameSnapshot || 'Product',
      sku: item.product?.sku || item.skuSnapshot || '',
      quantity: item.quantity,
    }));

    return await db.transaction(async (tx) => {
      // 1. Calculate deterministic allocation plan
      const plan = await this.allocationService.calculateAllocationPlan(
        quotationId,
        quotationItems,
        tx
      );

      // 2. Create fulfillment record
      const fulfillmentNumber = this.generateFulfillmentNumber();
      const fulfillment = await this.fulfillmentRepo.createFulfillment(
        {
          fulfillmentNumber,
          quotationId,
          status: plan.status,
          allocatedAt: new Date(),
          createdById: userId,
        },
        tx
      );

      // 3. Create allocation records and reserve inventory
      if (plan.allocations.length > 0) {
        await this.fulfillmentRepo.createAllocations(
          plan.allocations.map((alloc) => ({
            fulfillmentId: fulfillment.id,
            warehouseId: alloc.warehouseId,
            productId: alloc.productId,
            allocatedQuantity: alloc.allocatedQuantity,
            fulfilledQuantity: 0,
            status: AllocationStatus.ALLOCATED,
          })),
          tx
        );

        for (const alloc of plan.allocations) {
          await this.reservationService.reserve(
            alloc.warehouseId,
            alloc.productId,
            alloc.allocatedQuantity,
            fulfillment.id,
            userId,
            tx
          );
        }
      }

      // 4. Create backorders if any shortages
      if (plan.backorders.length > 0) {
        await this.fulfillmentRepo.createBackorders(
          plan.backorders.map((bo) => ({
            fulfillmentId: fulfillment.id,
            productId: bo.productId,
            requiredQuantity: bo.requiredQuantity,
            allocatedQuantity: bo.allocatedQuantity,
            backorderedQuantity: bo.backorderedQuantity,
            status: BackorderStatus.OPEN,
          })),
          tx
        );
      }

      return await this.fulfillmentRepo.findById(fulfillment.id, tx);
    });
  }

  async overrideAllocations(
    fulfillmentId: string,
    input: OverrideAllocationsInput,
    userId: string
  ) {
    const existing = await this.fulfillmentRepo.findById(fulfillmentId);
    if (!existing) {
      throw new NotFoundError('Fulfillment not found');
    }

    if (
      existing.status !== FulfillmentStatus.ALLOCATED &&
      existing.status !== FulfillmentStatus.PARTIALLY_ALLOCATED
    ) {
      throw new BadRequestError(
        `Cannot override allocations for fulfillment with status ${existing.status}`
      );
    }

    // Check if any items are already fulfilled
    const hasFulfilled = existing.allocations.some((a) => a.fulfilledQuantity > 0);
    if (hasFulfilled) {
      throw new BadRequestError(
        'Cannot override allocations once fulfillment has commenced'
      );
    }

    const quotation = await this.quotationRepo.findById(existing.quotationId);
    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    return await db.transaction(async (tx) => {
      // 1. Release previous reservations
      for (const oldAlloc of existing.allocations) {
        await this.reservationService.release(
          oldAlloc.warehouseId,
          oldAlloc.productId,
          oldAlloc.allocatedQuantity,
          fulfillmentId,
          userId,
          'Allocation override rebalance',
          tx
        );
      }

      // 2. Clear old allocations and backorders
      await this.fulfillmentRepo.deleteAllocationsByFulfillmentId(
        fulfillmentId,
        tx
      );
      await this.fulfillmentRepo.deleteBackordersByFulfillmentId(
        fulfillmentId,
        tx
      );

      // 3. Create new allocations and reserve stock
      await this.fulfillmentRepo.createAllocations(
        input.allocations.map((alloc) => ({
          fulfillmentId,
          warehouseId: alloc.warehouseId,
          productId: alloc.productId,
          allocatedQuantity: alloc.quantity,
          fulfilledQuantity: 0,
          status: AllocationStatus.ALLOCATED,
        })),
        tx
      );

      for (const alloc of input.allocations) {
        await this.reservationService.reserve(
          alloc.warehouseId,
          alloc.productId,
          alloc.quantity,
          fulfillmentId,
          userId,
          tx
        );
      }

      // 4. Recalculate backorders against quotation line items
      const allocatedQtyByProduct = new Map<string, number>();
      for (const alloc of input.allocations) {
        const cur = allocatedQtyByProduct.get(alloc.productId) || 0;
        allocatedQtyByProduct.set(alloc.productId, cur + alloc.quantity);
      }

      const newBackorders = [];
      for (const qItem of quotation.items || []) {
        const allocated = allocatedQtyByProduct.get(qItem.productId) || 0;
        if (allocated < qItem.quantity) {
          newBackorders.push({
            fulfillmentId,
            productId: qItem.productId,
            requiredQuantity: qItem.quantity,
            allocatedQuantity: allocated,
            backorderedQuantity: qItem.quantity - allocated,
            status: BackorderStatus.OPEN,
          });
        }
      }

      if (newBackorders.length > 0) {
        await this.fulfillmentRepo.createBackorders(newBackorders, tx);
      }

      const newStatus =
        newBackorders.length > 0
          ? FulfillmentStatus.PARTIALLY_ALLOCATED
          : FulfillmentStatus.ALLOCATED;

      await this.fulfillmentRepo.updateFulfillment(
        fulfillmentId,
        {
          status: newStatus,
          allocatedAt: new Date(),
        },
        tx
      );

      return await this.fulfillmentRepo.findById(fulfillmentId, tx);
    });
  }

  async fulfillItems(
    fulfillmentId: string,
    input: FulfillItemsInput,
    userId: string
  ) {
    const existing = await this.fulfillmentRepo.findById(fulfillmentId);
    if (!existing) {
      throw new NotFoundError('Fulfillment not found');
    }

    if (
      existing.status !== FulfillmentStatus.ALLOCATED &&
      existing.status !== FulfillmentStatus.PARTIALLY_ALLOCATED &&
      existing.status !== FulfillmentStatus.PARTIALLY_FULFILLED
    ) {
      throw new BadRequestError(
        `Cannot fulfill items for fulfillment in ${existing.status} status`
      );
    }

    return await db.transaction(async (tx) => {
      const currentAllocations = await this.fulfillmentRepo.getAllocationsByFulfillmentId(
        fulfillmentId,
        tx
      );

      if (input.items && input.items.length > 0) {
        // Partial or specific fulfillment by allocation
        for (const item of input.items) {
          const alloc = currentAllocations.find((a) => a.id === item.allocationId);
          if (!alloc) {
            throw new NotFoundError(
              `Allocation ${item.allocationId} not found in this fulfillment`
            );
          }

          const remainingAllocated =
            alloc.allocatedQuantity - alloc.fulfilledQuantity;
          if (item.quantity > remainingAllocated) {
            throw new BadRequestError(
              `Cannot fulfill ${item.quantity} units for allocation ${alloc.id}. Only ${remainingAllocated} units remaining to fulfill.`
            );
          }

          await this.reservationService.fulfill(
            alloc.warehouseId,
            alloc.productId,
            item.quantity,
            fulfillmentId,
            userId,
            input.notes,
            tx
          );

          const newFulfilledQty = alloc.fulfilledQuantity + item.quantity;
          const newAllocStatus =
            newFulfilledQty >= alloc.allocatedQuantity
              ? AllocationStatus.FULFILLED
              : AllocationStatus.PARTIALLY_FULFILLED;

          await this.fulfillmentRepo.updateAllocation(
            alloc.id,
            {
              fulfilledQuantity: newFulfilledQty,
              status: newAllocStatus,
            },
            tx
          );
        }
      } else {
        // Complete all remaining allocated quantities
        for (const alloc of currentAllocations) {
          const remaining = alloc.allocatedQuantity - alloc.fulfilledQuantity;
          if (remaining > 0) {
            await this.reservationService.fulfill(
              alloc.warehouseId,
              alloc.productId,
              remaining,
              fulfillmentId,
              userId,
              input.notes,
              tx
            );

            await this.fulfillmentRepo.updateAllocation(
              alloc.id,
              {
                fulfilledQuantity: alloc.allocatedQuantity,
                status: AllocationStatus.FULFILLED,
              },
              tx
            );
          }
        }
      }

      // Re-evaluate overall fulfillment status
      const updatedAllocations = await this.fulfillmentRepo.getAllocationsByFulfillmentId(
        fulfillmentId,
        tx
      );
      const backordersList = await this.fulfillmentRepo.getBackordersByFulfillmentId(
        fulfillmentId,
        tx
      );

      const allAllocationsFulfilled = updatedAllocations.every(
        (a) => a.status === AllocationStatus.FULFILLED
      );
      const hasAnyFulfilled = updatedAllocations.some(
        (a) => a.fulfilledQuantity > 0
      );
      const hasOpenBackorders = backordersList.some(
        (bo) => bo.status === BackorderStatus.OPEN
      );

      let overallStatus = existing.status;
      let fulfilledAt = existing.fulfilledAt;

      if (allAllocationsFulfilled && !hasOpenBackorders) {
        overallStatus = FulfillmentStatus.FULFILLED;
        fulfilledAt = new Date();
      } else if (hasAnyFulfilled) {
        overallStatus = FulfillmentStatus.PARTIALLY_FULFILLED;
      }

      await this.fulfillmentRepo.updateFulfillment(
        fulfillmentId,
        {
          status: overallStatus,
          fulfilledAt,
        },
        tx
      );

      return await this.fulfillmentRepo.findById(fulfillmentId, tx);
    });
  }

  async cancelFulfillment(
    fulfillmentId: string,
    reason: string,
    userId: string
  ) {
    const existing = await this.fulfillmentRepo.findById(fulfillmentId);
    if (!existing) {
      throw new NotFoundError('Fulfillment not found');
    }

    if (
      existing.status === FulfillmentStatus.FULFILLED ||
      existing.status === FulfillmentStatus.CANCELLED
    ) {
      throw new BadRequestError(
        `Cannot cancel fulfillment in ${existing.status} status`
      );
    }

    return await db.transaction(async (tx) => {
      const currentAllocations = await this.fulfillmentRepo.getAllocationsByFulfillmentId(
        fulfillmentId,
        tx
      );

      // Release reserved stock for unfulfilled allocations
      for (const alloc of currentAllocations) {
        const unfulfilled = alloc.allocatedQuantity - alloc.fulfilledQuantity;
        if (unfulfilled > 0) {
          await this.reservationService.release(
            alloc.warehouseId,
            alloc.productId,
            unfulfilled,
            fulfillmentId,
            userId,
            `Fulfillment cancellation: ${reason}`,
            tx
          );
        }

        await this.fulfillmentRepo.updateAllocation(
          alloc.id,
          { status: AllocationStatus.CANCELLED },
          tx
        );
      }

      // Cancel backorders
      const backordersList = await this.fulfillmentRepo.getBackordersByFulfillmentId(
        fulfillmentId,
        tx
      );
      for (const bo of backordersList) {
        if (bo.status === BackorderStatus.OPEN) {
          await tx
            .update(backorders)
            .set({ status: BackorderStatus.CANCELLED, updatedAt: new Date() })
            .where(eq(backorders.id, bo.id));
        }
      }

      await this.fulfillmentRepo.updateFulfillment(
        fulfillmentId,
        {
          status: FulfillmentStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
        tx
      );

      return await this.fulfillmentRepo.findById(fulfillmentId, tx);
    });
  }

  async getById(id: string) {
    const fulfillment = await this.fulfillmentRepo.findById(id);
    if (!fulfillment) {
      throw new NotFoundError('Fulfillment not found');
    }
    return fulfillment;
  }

  async getByQuotationId(quotationId: string) {
    return this.fulfillmentRepo.findByQuotationId(quotationId);
  }

  async list(query: ListFulfillmentsQuery) {
    return this.fulfillmentRepo.list(query);
  }
}
