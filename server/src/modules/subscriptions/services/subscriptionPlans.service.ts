import {
  subscriptionPlansRepository,
  SubscriptionPlansRepository,
  PaginatedSubscriptionPlans,
} from '../repositories/subscriptionPlans.repository.js';
import {
  CreateSubscriptionPlanInput,
  UpdateSubscriptionPlanInput,
  SubscriptionPlanQueryInput,
} from '../validators/subscriptionPlans.validator.js';
import { SubscriptionPlan } from '../../../database/schema/index.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../../common/errors/index.js';

export class SubscriptionPlansService {
  constructor(private readonly repository: SubscriptionPlansRepository = subscriptionPlansRepository) {}

  async listPlans(query: SubscriptionPlanQueryInput): Promise<PaginatedSubscriptionPlans> {
    return this.repository.findAll(query);
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.repository.findById(id);
    if (!plan) {
      throw new NotFoundError(`Subscription plan with ID '${id}' not found`);
    }
    return plan;
  }

  async createPlan(data: CreateSubscriptionPlanInput): Promise<SubscriptionPlan> {
    const code = data.code.trim().toUpperCase();
    const existingCode = await this.repository.findByCode(code);
    if (existingCode) {
      throw new ConflictError(`Subscription plan with code '${code}' already exists`);
    }

    const name = data.name.trim();
    const existingName = await this.repository.findByName(name);
    if (existingName) {
      throw new ConflictError(`Subscription plan with name '${name}' already exists`);
    }

    const priceNum = parseFloat(data.price);
    if (isNaN(priceNum) || priceNum < 0) {
      throw new BadRequestError('Subscription plan price must be a non-negative number');
    }

    return this.repository.create({
      name,
      code,
      description: data.description?.trim() || null,
      billingInterval: data.billingInterval,
      price: data.price,
      currency: data.currency.trim().toUpperCase(),
      features: data.features || [],
      isActive: data.isActive ?? true,
    });
  }

  async updatePlan(id: string, data: UpdateSubscriptionPlanInput): Promise<SubscriptionPlan> {
    await this.getPlanById(id);

    if (data.code) {
      const code = data.code.trim().toUpperCase();
      const existing = await this.repository.findByCode(code);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Subscription plan with code '${code}' already exists`);
      }
    }

    if (data.name) {
      const name = data.name.trim();
      const existing = await this.repository.findByName(name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Subscription plan with name '${name}' already exists`);
      }
    }

    if (data.price !== undefined) {
      const priceNum = parseFloat(data.price);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new BadRequestError('Subscription plan price must be a non-negative number');
      }
    }

    const updated = await this.repository.update(id, {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.code ? { code: data.code.trim().toUpperCase() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.billingInterval ? { billingInterval: data.billingInterval } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.currency ? { currency: data.currency.trim().toUpperCase() } : {}),
      ...(data.features !== undefined ? { features: data.features } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    });

    if (!updated) {
      throw new NotFoundError(`Subscription plan with ID '${id}' not found`);
    }

    return updated;
  }

  async deletePlan(id: string): Promise<void> {
    await this.getPlanById(id);
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Subscription plan with ID '${id}' not found`);
    }
  }
}

export const subscriptionPlansService = new SubscriptionPlansService();
