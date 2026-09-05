import {
  priceListsRepository,
  PriceListsRepository,
  PaginatedPriceLists,
  PaginatedPriceListItems,
  PriceListItemWithProduct,
} from '../repositories/priceLists.repository.js';
import {
  CreatePriceListInput,
  UpdatePriceListInput,
  PriceListQueryInput,
  CreatePriceListItemInput,
  UpdatePriceListItemInput,
  PriceListItemQueryInput,
} from '../validators/priceList.validator.js';
import { productsRepository } from '../../products/repositories/products.repository.js';
import { PriceList, PriceListItem } from '../../../database/schema/index.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../common/errors/index.js';

export class PriceListsService {
  constructor(private readonly repository: PriceListsRepository = priceListsRepository) {}

  async listPriceLists(query: PriceListQueryInput): Promise<PaginatedPriceLists> {
    return this.repository.findAll(query);
  }

  async getPriceListById(id: string): Promise<PriceList> {
    const list = await this.repository.findById(id);
    if (!list) {
      throw new NotFoundError(`Price list with ID '${id}' not found`);
    }
    return list;
  }

  async createPriceList(data: CreatePriceListInput): Promise<PriceList> {
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new ConflictError(`Price list with name '${data.name}' already exists`);
    }

    return this.repository.create({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      currency: data.currency.trim().toUpperCase(),
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
    });
  }

  async updatePriceList(id: string, data: UpdatePriceListInput): Promise<PriceList> {
    const current = await this.getPriceListById(id);

    if (data.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Price list with name '${data.name}' already exists`);
      }
    }

    const updatedCurrency = data.currency ? data.currency.trim().toUpperCase() : current.currency;

    const updated = await this.repository.update(
      id,
      {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.currency ? { currency: updatedCurrency } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      updatedCurrency
    );

    if (!updated) {
      throw new NotFoundError(`Price list with ID '${id}' not found`);
    }

    return updated;
  }

  async deletePriceList(id: string): Promise<void> {
    await this.getPriceListById(id);

    // Deactivation or deletion
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Price list with ID '${id}' not found`);
    }
  }

  // --- Price List Items Methods ---

  async listPriceListItems(
    priceListId: string,
    query: PriceListItemQueryInput
  ): Promise<PaginatedPriceListItems> {
    await this.getPriceListById(priceListId);
    return this.repository.findItemsByPriceList(priceListId, query);
  }

  async addProductPrice(
    priceListId: string,
    data: CreatePriceListItemInput
  ): Promise<PriceListItem> {
    const list = await this.getPriceListById(priceListId);
    if (!list.isActive) {
      throw new BadRequestError(`Cannot add items to inactive price list '${list.name}'`);
    }

    // 1. Verify product exists and is active
    const product = await productsRepository.findById(data.productId);
    if (!product) {
      throw new NotFoundError(`Product with ID '${data.productId}' not found`);
    }
    if (!product.isActive) {
      throw new BadRequestError(`Cannot add inactive product '${product.name}' to price list`);
    }

    // 2. Verify product is not already in this price list
    const existingItem = await this.repository.findItem(priceListId, data.productId);
    if (existingItem) {
      throw new ConflictError(
        `Product '${product.name}' (${product.sku}) already exists in this price list`
      );
    }

    return this.repository.createItem({
      priceListId,
      productId: data.productId,
      price: data.price,
    });
  }

  async updateProductPrice(
    priceListId: string,
    itemId: string,
    data: UpdatePriceListItemInput
  ): Promise<PriceListItemWithProduct> {
    await this.getPriceListById(priceListId);

    const item = await this.repository.findItemById(itemId);
    if (!item || item.priceListId !== priceListId) {
      throw new NotFoundError(`Price list item with ID '${itemId}' not found in this price list`);
    }

    const updated = await this.repository.updateItem(itemId, data.price);
    if (!updated) {
      throw new NotFoundError(`Price list item with ID '${itemId}' not found`);
    }

    return {
      ...updated,
      product: item.product,
    };
  }

  async deleteProductPrice(priceListId: string, itemId: string): Promise<void> {
    await this.getPriceListById(priceListId);

    const item = await this.repository.findItemById(itemId);
    if (!item || item.priceListId !== priceListId) {
      throw new NotFoundError(`Price list item with ID '${itemId}' not found in this price list`);
    }

    const deleted = await this.repository.deleteItem(itemId);
    if (!deleted) {
      throw new NotFoundError(`Price list item with ID '${itemId}' not found`);
    }
  }
}

export const priceListsService = new PriceListsService();
