import { apiClient } from '@/api/apiClient';
import { ApiResponse } from '@/types';

export type FulfillmentStatus =
  | 'PENDING'
  | 'ALLOCATED'
  | 'PARTIALLY_ALLOCATED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED';

export interface BackendFulfillmentItem {
  id: string;
  fulfillmentNumber: string;
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  status: FulfillmentStatus;
  allocatedAt?: string | null;
  fulfilledAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentQueryParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  warehouse?: WarehouseItem;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export const fulfillmentApi = {
  getFulfillments: async (params?: FulfillmentQueryParams): Promise<{
    items: BackendFulfillmentItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get<ApiResponse<BackendFulfillmentItem[]>>('/fulfillment', {
      params,
    });
    const meta = response.data.meta;
    return {
      items: response.data.data || [],
      total: meta?.total || (response.data.data ? response.data.data.length : 0),
      page: meta?.page || 1,
      limit: meta?.limit || 20,
      totalPages: (meta as { totalPages?: number })?.totalPages || 1,
    };
  },

  getFulfillmentById: async (id: string): Promise<BackendFulfillmentItem> => {
    const response = await apiClient.get<ApiResponse<BackendFulfillmentItem>>(`/fulfillment/${id}`);
    return response.data.data!;
  },

  fulfillOrder: async (id: string, notes?: string): Promise<BackendFulfillmentItem> => {
    const response = await apiClient.post<ApiResponse<BackendFulfillmentItem>>(`/fulfillment/${id}/fulfill`, {
      notes,
    });
    return response.data.data!;
  },

  cancelFulfillment: async (id: string, reason: string): Promise<BackendFulfillmentItem> => {
    const response = await apiClient.post<ApiResponse<BackendFulfillmentItem>>(`/fulfillment/${id}/cancel`, {
      cancellationReason: reason,
    });
    return response.data.data!;
  },

  getWarehouses: async (): Promise<WarehouseItem[]> => {
    const response = await apiClient.get<ApiResponse<WarehouseItem[]>>('/warehouses');
    return response.data.data || [];
  },

  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get<ApiResponse<InventoryItem[]>>('/inventory');
    return response.data.data || [];
  },
};
