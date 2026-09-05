export interface CreateWarehouseInput {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  pincode?: string | null;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateWarehouseInput {
  name?: string;
  code?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  pincode?: string | null;
  priority?: number;
  isActive?: boolean;
}

export interface ListWarehousesQuery {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
}
