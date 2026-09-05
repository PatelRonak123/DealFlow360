import {
  warehousesRepository,
  WarehousesRepository,
} from '../repositories/warehouses.repository.js';
import {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  ListWarehousesQuery,
} from '../types/index.js';
import {
  NotFoundError,
  ConflictError,
} from '../../../common/errors/index.js';

export class WarehousesService {
  constructor(
    private readonly repository: WarehousesRepository = warehousesRepository
  ) {}

  async createWarehouse(input: CreateWarehouseInput) {
    const existingCode = await this.repository.findByCode(input.code);
    if (existingCode) {
      throw new ConflictError(
        `Warehouse with code '${input.code}' already exists`
      );
    }

    const existingName = await this.repository.findByName(input.name);
    if (existingName) {
      throw new ConflictError(
        `Warehouse with name '${input.name}' already exists`
      );
    }

    return await this.repository.create({
      name: input.name,
      code: input.code.toUpperCase(),
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      country: input.country || 'India',
      pincode: input.pincode || null,
      priority: input.priority !== undefined ? input.priority : 1,
      isActive: input.isActive !== undefined ? input.isActive : true,
    });
  }

  async getWarehouseById(id: string) {
    const warehouse = await this.repository.findById(id);
    if (!warehouse) {
      throw new NotFoundError(`Warehouse with ID '${id}' not found`);
    }
    return warehouse;
  }

  async updateWarehouse(id: string, input: UpdateWarehouseInput) {
    const existing = await this.getWarehouseById(id);

    if (input.code && input.code !== existing.code) {
      const codeMatch = await this.repository.findByCode(input.code);
      if (codeMatch && codeMatch.id !== id) {
        throw new ConflictError(
          `Warehouse with code '${input.code}' already exists`
        );
      }
    }

    if (input.name && input.name !== existing.name) {
      const nameMatch = await this.repository.findByName(input.name);
      if (nameMatch && nameMatch.id !== id) {
        throw new ConflictError(
          `Warehouse with name '${input.name}' already exists`
        );
      }
    }

    const updated = await this.repository.update(id, {
      name: input.name ?? existing.name,
      code: input.code ? input.code.toUpperCase() : existing.code,
      address: input.address !== undefined ? input.address : existing.address,
      city: input.city !== undefined ? input.city : existing.city,
      state: input.state !== undefined ? input.state : existing.state,
      country: input.country ?? existing.country,
      pincode: input.pincode !== undefined ? input.pincode : existing.pincode,
      priority: input.priority ?? existing.priority,
      isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
    });

    if (!updated) {
      throw new NotFoundError(`Warehouse with ID '${id}' not found`);
    }

    return updated;
  }

  async deleteWarehouse(id: string) {
    await this.getWarehouseById(id);
    return await this.repository.delete(id);
  }

  async listWarehouses(query: ListWarehousesQuery) {
    return await this.repository.list(query);
  }
}

export const warehousesService = new WarehousesService();
