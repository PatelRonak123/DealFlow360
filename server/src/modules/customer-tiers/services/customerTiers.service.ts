import {
  customerTiersRepository,
  CustomerTiersRepository,
  PaginatedCustomerTiers,
} from '../repositories/customerTiers.repository.js';
import {
  CreateCustomerTierInput,
  UpdateCustomerTierInput,
  CustomerTierQueryInput,
} from '../validators/customerTier.validator.js';
import { CustomerTier } from '../../../database/schema/index.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../common/errors/index.js';

export class CustomerTiersService {
  constructor(private readonly repository: CustomerTiersRepository = customerTiersRepository) {}

  async listCustomerTiers(query: CustomerTierQueryInput): Promise<PaginatedCustomerTiers> {
    return this.repository.findAll(query);
  }

  async getCustomerTierById(id: string): Promise<CustomerTier> {
    const tier = await this.repository.findById(id);
    if (!tier) {
      throw new NotFoundError(`Customer tier with ID '${id}' not found`);
    }
    return tier;
  }

  async createCustomerTier(data: CreateCustomerTierInput): Promise<CustomerTier> {
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new ConflictError(`Customer tier with name '${data.name}' already exists`);
    }

    return this.repository.create({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      isActive: data.isActive ?? true,
    });
  }

  async updateCustomerTier(id: string, data: UpdateCustomerTierInput): Promise<CustomerTier> {
    await this.getCustomerTierById(id);

    if (data.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Customer tier with name '${data.name}' already exists`);
      }
    }

    // If deactivating, verify there are no active customers in this tier
    if (data.isActive === false) {
      const activeCustomersCount = await this.repository.countActiveCustomers(id);
      if (activeCustomersCount > 0) {
        throw new BadRequestError(
          `Cannot deactivate customer tier: ${activeCustomersCount} active customer(s) are assigned to this tier`
        );
      }
    }

    const updated = await this.repository.update(id, {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    if (!updated) {
      throw new NotFoundError(`Customer tier with ID '${id}' not found`);
    }

    return updated;
  }

  async deleteCustomerTier(id: string): Promise<void> {
    await this.getCustomerTierById(id);

    const activeCustomersCount = await this.repository.countActiveCustomers(id);
    if (activeCustomersCount > 0) {
      throw new ConflictError(
        `Cannot delete customer tier: ${activeCustomersCount} active customer(s) are assigned to this tier`
      );
    }

    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Customer tier with ID '${id}' not found`);
    }
  }
}

export const customerTiersService = new CustomerTiersService();
