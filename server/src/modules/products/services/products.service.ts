import {
  productsRepository,
  ProductsRepository,
  PaginatedProducts,
  ProductWithCategory,
} from '../repositories/products.repository.js';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from '../validators/product.validator.js';
import { categoriesRepository } from '../../categories/repositories/categories.repository.js';
import { Product } from '../../../database/schema/index.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../common/errors/index.js';

export class ProductsService {
  constructor(private readonly repository: ProductsRepository = productsRepository) {}

  async listProducts(query: ProductQueryInput): Promise<PaginatedProducts> {
    return this.repository.findAll(query);
  }

  async getProductById(id: string): Promise<ProductWithCategory> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }
    return product;
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    // 1. Verify category exists and is active
    const category = await categoriesRepository.findById(data.categoryId);
    if (!category) {
      throw new NotFoundError(`Product category with ID '${data.categoryId}' not found`);
    }
    if (!category.isActive) {
      throw new BadRequestError(`Cannot create product under inactive category '${category.name}'`);
    }

    // 2. Verify SKU is unique
    const existingSku = await this.repository.findBySku(data.sku);
    if (existingSku) {
      throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
    }

    return this.repository.create({
      name: data.name.trim(),
      sku: data.sku.trim().toUpperCase(),
      description: data.description?.trim() || null,
      categoryId: data.categoryId,
      productType: data.productType,
      basePrice: data.basePrice,
      currency: data.currency.trim().toUpperCase(),
      isActive: data.isActive ?? true,
    });
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    await this.getProductById(id);

    // 1. Verify SKU uniqueness if changing
    if (data.sku) {
      const existingSku = await this.repository.findBySku(data.sku);
      if (existingSku && existingSku.id !== id) {
        throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
      }
    }

    // 2. Verify category if changing
    if (data.categoryId) {
      const category = await categoriesRepository.findById(data.categoryId);
      if (!category) {
        throw new NotFoundError(`Product category with ID '${data.categoryId}' not found`);
      }
      if (!category.isActive) {
        throw new BadRequestError(`Cannot assign product to inactive category '${category.name}'`);
      }
    }

    const updated = await this.repository.update(id, {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.sku ? { sku: data.sku.trim().toUpperCase() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      ...(data.productType ? { productType: data.productType } : {}),
      ...(data.basePrice ? { basePrice: data.basePrice } : {}),
      ...(data.currency ? { currency: data.currency.trim().toUpperCase() } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    if (!updated) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }

    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);

    // Soft deactivation or deletion
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Product with ID '${id}' not found`);
    }
  }
}

export const productsService = new ProductsService();
