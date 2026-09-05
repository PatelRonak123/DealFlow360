import { DbClient } from '../../../database/db.js';
import { InventoryRepository } from '../../inventory/repositories/inventory.repository.js';
import { BadRequestError } from '../../../common/errors/index.js';

export class InventoryReservationService {
  constructor(private inventoryRepo: InventoryRepository) {}

  async reserve(
    warehouseId: string,
    productId: string,
    quantity: number,
    fulfillmentId: string,
    userId: string,
    tx: DbClient
  ) {
    const inv = await this.inventoryRepo.findByWarehouseAndProduct(
      warehouseId,
      productId,
      tx
    );

    if (!inv) {
      throw new BadRequestError(
        `Inventory record not found for warehouse ${warehouseId} and product ${productId}`
      );
    }

    const available = inv.quantityOnHand - inv.reservedQuantity;
    if (available < quantity) {
      throw new BadRequestError(
        `Insufficient available inventory for reservation. Required: ${quantity}, Available: ${available} (On Hand: ${inv.quantityOnHand}, Reserved: ${inv.reservedQuantity})`
      );
    }

    const updated = await this.inventoryRepo.updateStock(
      inv.id,
      {
        reservedQuantity: inv.reservedQuantity + quantity,
      },
      tx
    );

    await this.inventoryRepo.createTransaction(
      {
        inventoryId: updated.id,
        warehouseId,
        productId,
        transactionType: 'RESERVED',
        quantity,
        quantityOnHandAfter: updated.quantityOnHand,
        reservedQuantityAfter: updated.reservedQuantity,
        referenceType: 'FULFILLMENT',
        referenceId: fulfillmentId,
        notes: `Reserved ${quantity} units for fulfillment`,
        createdById: userId,
      },
      tx
    );

    return updated;
  }

  async release(
    warehouseId: string,
    productId: string,
    quantity: number,
    fulfillmentId: string,
    userId: string,
    notes?: string,
    tx?: DbClient
  ) {
    const inv = await this.inventoryRepo.findByWarehouseAndProduct(
      warehouseId,
      productId,
      tx
    );

    if (!inv) {
      return null;
    }

    const newReserved = Math.max(0, inv.reservedQuantity - quantity);
    const releasedAmount = inv.reservedQuantity - newReserved;

    const updated = await this.inventoryRepo.updateStock(
      inv.id,
      {
        reservedQuantity: newReserved,
      },
      tx
    );

    await this.inventoryRepo.createTransaction(
      {
        inventoryId: updated.id,
        warehouseId,
        productId,
        transactionType: 'RESERVATION_RELEASED',
        quantity: releasedAmount,
        quantityOnHandAfter: updated.quantityOnHand,
        reservedQuantityAfter: updated.reservedQuantity,
        referenceType: 'FULFILLMENT',
        referenceId: fulfillmentId,
        notes: notes || `Released ${releasedAmount} reserved units`,
        createdById: userId,
      },
      tx
    );

    return updated;
  }

  async fulfill(
    warehouseId: string,
    productId: string,
    quantity: number,
    fulfillmentId: string,
    userId: string,
    notes?: string,
    tx?: DbClient
  ) {
    const inv = await this.inventoryRepo.findByWarehouseAndProduct(
      warehouseId,
      productId,
      tx
    );

    if (!inv) {
      throw new BadRequestError(
        `Inventory record not found for warehouse ${warehouseId} and product ${productId}`
      );
    }

    const newOnHand = inv.quantityOnHand - quantity;
    const newReserved = Math.max(0, inv.reservedQuantity - quantity);

    if (newOnHand < 0) {
      throw new BadRequestError(
        `Cannot fulfill ${quantity} units. On-hand quantity is only ${inv.quantityOnHand}`
      );
    }

    const updated = await this.inventoryRepo.updateStock(
      inv.id,
      {
        quantityOnHand: newOnHand,
        reservedQuantity: newReserved,
      },
      tx
    );

    await this.inventoryRepo.createTransaction(
      {
        inventoryId: updated.id,
        warehouseId,
        productId,
        transactionType: 'FULFILLED',
        quantity: -quantity,
        quantityOnHandAfter: updated.quantityOnHand,
        reservedQuantityAfter: updated.reservedQuantity,
        referenceType: 'FULFILLMENT',
        referenceId: fulfillmentId,
        notes: notes || `Fulfilled ${quantity} units`,
        createdById: userId,
      },
      tx
    );

    return updated;
  }
}
