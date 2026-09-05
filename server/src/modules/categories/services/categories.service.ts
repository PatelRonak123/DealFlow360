import {
  categoriesRepository,
  CategoriesRepository,
  PaginatedCategories,
} from "../repositories/categories.repository.js";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
} from "../validators/category.validator.js";
import { ProductCategory } from "../../../database/schema/index.js";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../../common/errors/index.js";

export class CategoriesService {
  constructor(
    private readonly repository: CategoriesRepository = categoriesRepository,
  ) {}

  async listCategories(
    query: CategoryQueryInput,
  ): Promise<PaginatedCategories> {
    return this.repository.findAll(query);
  }

  async getCategoryById(id: string): Promise<ProductCategory> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundError(`Product category with ID '${id}' not found`);
    }
    return category;
  }

  async createCategory(data: CreateCategoryInput): Promise<ProductCategory> {
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new ConflictError(
        `Product category with name '${data.name}' already exists`,
      );
    }

    return this.repository.create({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      isActive: data.isActive ?? true,
    });
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryInput,
  ): Promise<ProductCategory> {
    await this.getCategoryById(id);

    if (data.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(
          `Product category with name '${data.name}' already exists`,
        );
      }
    }

    // If deactivating, verify there are no active products in this category
    if (data.isActive === false) {
      const activeProductsCount = await this.repository.countActiveProducts(id);
      if (activeProductsCount > 0) {
        throw new BadRequestError(
          `Cannot deactivate category: ${activeProductsCount} active product(s) are assigned to this category`,
        );
      }
    }

    const updated = await this.repository.update(id, {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    if (!updated) {
      throw new NotFoundError(`Product category with ID '${id}' not found`);
    }

    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id);

    const activeProductsCount = await this.repository.countActiveProducts(id);
    if (activeProductsCount > 0) {
      throw new ConflictError(
        `Cannot delete category: ${activeProductsCount} active product(s) are assigned to this category`,
      );
    }

    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Product category with ID '${id}' not found`);
    }
  }
}

export const categoriesService = new CategoriesService();
