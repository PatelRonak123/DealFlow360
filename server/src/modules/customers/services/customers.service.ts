import {
  customersRepository,
  CustomersRepository,
  PaginatedCustomers,
  CustomerWithTier,
} from '../repositories/customers.repository.js';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  UpdateCustomerStatusInput,
  CustomerQueryInput,
} from '../validators/customer.validator.js';
import { customerTiersRepository } from '../../customer-tiers/repositories/customerTiers.repository.js';
import { Customer } from '../../../database/schema/index.js';
import {
  NotFoundError,
  BadRequestError,
} from '../../../common/errors/index.js';

export class CustomersService {
  constructor(private readonly repository: CustomersRepository = customersRepository) {}

  async listCustomers(query: CustomerQueryInput): Promise<PaginatedCustomers> {
    return this.repository.findAll(query);
  }

  async getCustomerById(id: string): Promise<CustomerWithTier> {
    const customer = await this.repository.findById(id);
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }
    return customer;
  }

  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    // 1. Verify customer tier exists and is active
    const tier = await customerTiersRepository.findById(data.customerTierId);
    if (!tier) {
      throw new NotFoundError(`Customer tier with ID '${data.customerTierId}' not found`);
    }
    if (!tier.isActive) {
      throw new BadRequestError(`Cannot assign customer to inactive customer tier '${tier.name}'`);
    }

    return this.repository.create({
      companyName: data.companyName.trim(),
      contactName: data.contactName?.trim() || null,
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      customerTierId: data.customerTierId,
      status: data.status,
    });
  }

  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer> {
    await this.getCustomerById(id);

    // If updating customer tier, verify it exists and is active
    if (data.customerTierId) {
      const tier = await customerTiersRepository.findById(data.customerTierId);
      if (!tier) {
        throw new NotFoundError(`Customer tier with ID '${data.customerTierId}' not found`);
      }
      if (!tier.isActive) {
        throw new BadRequestError(`Cannot assign customer to inactive customer tier '${tier.name}'`);
      }
    }

    const updated = await this.repository.update(id, {
      ...(data.companyName ? { companyName: data.companyName.trim() } : {}),
      ...(data.contactName !== undefined ? { contactName: data.contactName?.trim() || null } : {}),
      ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.customerTierId ? { customerTierId: data.customerTierId } : {}),
      ...(data.status ? { status: data.status } : {}),
    });

    if (!updated) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }

    return updated;
  }

  async updateCustomerStatus(id: string, data: UpdateCustomerStatusInput): Promise<Customer> {
    await this.getCustomerById(id);

    const updated = await this.repository.update(id, {
      status: data.status,
    });

    if (!updated) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }

    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.getCustomerById(id);

    // Soft delete / deletion
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Customer with ID '${id}' not found`);
    }
  }
}

export const customersService = new CustomersService();
