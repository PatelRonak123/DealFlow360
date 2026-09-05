import { db } from '../../../database/db.js';
import { InventoryRepository } from '../repositories/inventory.repository.js';
import { WarehousesRepository } from '../../warehouses/repositories/warehouses.repository.js';
import { ProductsRepository } from '../../products/repositories/products.repository.js';
import {
  AdjustStockInput,
  SetStockInput,
  ListInventoryQuery,
  ProductInventorySummary,
} from '../types/index.js';
import { NotFoundError, BadRequestError } from '../../../common/errors/index.js';

export class InventoryService {
  constructor(
    private inventoryRepo: InventoryRepository,
    private warehouseRepo: WarehousesRepository,
    private productRepo: ProductsRepository
  ) {}

  async adjustStock(input: AdjustStockInput, userId: string) {
    const warehouse = await this.warehouseRepo.findById(input.warehouseId);
    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }
    if (!warehouse.isActive) {
      throw new BadRequestError('Cannot adjust stock in an inactive warehouse');
    }

    const product = await this.productRepo.findById(input.productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return await db.transaction(async (tx) => {
      let inv = await this.inventoryRepo.findByWarehouseAndProduct(
        input.warehouseId,
        input.productId,
        tx
      );

      if (!inv) {
        inv = await this.inventoryRepo.upsert(
          {
            warehouseId: input.warehouseId,
            productId: input.productId,
            quantityOnHand: 0,
            reservedQuantity: 0,
            reorderLevel: 0,
          },
          tx
        );
      }

      const newOnHand = inv.quantityOnHand + input.quantity;
      if (newOnHand < 0) {
        throw new BadRequestError(
          `Insufficient stock to decrease. Current on-hand: ${inv.quantityOnHand}, requested reduction: ${Math.abs(input.quantity)}`
        );
      }

      if (newOnHand < inv.reservedQuantity) {
        throw new BadRequestError(
          `Cannot reduce stock below reserved quantity. Current reserved: ${inv.reservedQuantity}, new on-hand would be: ${newOnHand}`
        );
      }

      const updated = await this.inventoryRepo.updateStock(
        inv.id,
        { quantityOnHand: newOnHand },
        tx
      );

      const defaultTxType = input.quantity >= 0 ? 'STOCK_RECEIVED' : 'STOCK_ADJUSTED';
      const txType = input.transactionType || defaultTxType;

      await this.inventoryRepo.createTransaction(
        {
          inventoryId: updated.id,
          warehouseId: input.warehouseId,
          productId: input.productId,
          transactionType: txType,
          quantity: input.quantity,
          quantityOnHandAfter: updated.quantityOnHand,
          reservedQuantityAfter: updated.reservedQuantity,
          referenceType: input.referenceType || 'MANUAL',
          referenceId: input.referenceId,
          notes: input.notes,
          createdById: userId,
        },
        tx
      );

      return {
        ...updated,
        availableQuantity: updated.quantityOnHand - updated.reservedQuantity,
        warehouseName: warehouse.name,
        warehouseCode: warehouse.code,
        productName: product.name,
        productSku: product.sku,
      };
    });
  }

  async setStock(input: SetStockInput, userId: string) {
    const warehouse = await this.warehouseRepo.findById(input.warehouseId);
    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }
    if (!warehouse.isActive) {
      throw new BadRequestError('Cannot set stock in an inactive warehouse');
    }

    const product = await this.productRepo.findById(input.productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return await db.transaction(async (tx) => {
      let inv = await this.inventoryRepo.findByWarehouseAndProduct(
        input.warehouseId,
        input.productId,
        tx
      );

      const currentOnHand = inv ? inv.quantityOnHand : 0;
      const currentReserved = inv ? inv.reservedQuantity : 0;

      if (input.quantityOnHand < currentReserved) {
        throw new BadRequestError(
          `Cannot set stock to ${input.quantityOnHand} which is lower than reserved quantity (${currentReserved})`
        );
      }

      const delta = input.quantityOnHand - currentOnHand;

      const updated = await this.inventoryRepo.upsert(
        {
          warehouseId: input.warehouseId,
          productId: input.productId,
          quantityOnHand: input.quantityOnHand,
          reorderLevel: input.reorderLevel !== undefined ? input.reorderLevel : inv?.reorderLevel || 0,
        },
        tx
      );

      if (delta !== 0) {
        await this.inventoryRepo.createTransaction(
          {
            inventoryId: updated.id,
            warehouseId: input.warehouseId,
            productId: input.productId,
            transactionType: 'STOCK_ADJUSTED',
            quantity: delta,
            quantityOnHandAfter: updated.quantityOnHand,
            reservedQuantityAfter: updated.reservedQuantity,
            referenceType: 'MANUAL',
            notes: `Stock set directly from ${currentOnHand} to ${input.quantityOnHand}`,
            createdById: userId,
          },
          tx
        );
      }

      return {
        ...updated,
        availableQuantity: updated.quantityOnHand - updated.reservedQuantity,
        warehouseName: warehouse.name,
        warehouseCode: warehouse.code,
        productName: product.name,
        productSku: product.sku,
      };
    });
  }

  async getProductInventorySummary(productId: string): Promise<ProductInventorySummary> {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const items = await this.inventoryRepo.findByProductId(productId);

    let totalOnHand = 0;
    let totalReserved = 0;

    const warehouses = items.map((item) => {
      const available = item.inventory.quantityOnHand - item.inventory.reservedQuantity;
      totalOnHand += item.inventory.quantityOnHand;
      totalReserved += item.inventory.reservedQuantity;

      return {
        warehouseId: item.warehouse.id,
        warehouseName: item.warehouse.name,
        warehouseCode: item.warehouse.code,
        priority: item.warehouse.priority,
        quantityOnHand: item.inventory.quantityOnHand,
        reservedQuantity: item.inventory.reservedQuantity,
        availableQuantity: Math.max(0, available),
      };
    });

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      totalOnHand,
      totalReserved,
      totalAvailable: Math.max(0, totalOnHand - totalReserved),
      warehouses,
    };
  }

  async listInventory(query: ListInventoryQuery) {
    return this.inventoryRepo.list(query);
  }

  async listTransactions(filters: {
    warehouseId?: string;
    productId?: string;
    transactionType?: string;
    page?: number;
    limit?: number;
  }) {
    return this.inventoryRepo.listTransactions(filters);
  }
}
