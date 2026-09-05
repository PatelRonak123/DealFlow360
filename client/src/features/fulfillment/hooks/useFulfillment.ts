import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fulfillmentApi,
  FulfillmentQueryParams,
} from '../api/fulfillmentApi';

export const fulfillmentKeys = {
  all: ['fulfillment'] as const,
  lists: () => [...fulfillmentKeys.all, 'list'] as const,
  list: (params?: FulfillmentQueryParams) => [...fulfillmentKeys.lists(), params] as const,
  detail: (id: string) => [...fulfillmentKeys.all, 'detail', id] as const,
  warehouses: () => [...fulfillmentKeys.all, 'warehouses'] as const,
  inventory: () => [...fulfillmentKeys.all, 'inventory'] as const,
};

export function useFulfillmentsList(params?: FulfillmentQueryParams) {
  return useQuery({
    queryKey: fulfillmentKeys.list(params),
    queryFn: () => fulfillmentApi.getFulfillments(params),
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
  });
}

export function useWarehousesList() {
  return useQuery({
    queryKey: fulfillmentKeys.warehouses(),
    queryFn: () => fulfillmentApi.getWarehouses(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInventoryList() {
  return useQuery({
    queryKey: fulfillmentKeys.inventory(),
    queryFn: () => fulfillmentApi.getInventory(),
    staleTime: 1000 * 60,
  });
}

export function useFulfillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      fulfillmentApi.fulfillOrder(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentKeys.all });
      toast.success(`Fulfillment ${data.fulfillmentNumber} marked as dispatched!`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to dispatch fulfillment');
    },
  });
}

export function useCancelFulfillmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      fulfillmentApi.cancelFulfillment(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentKeys.all });
      toast.error(`Fulfillment ${data.fulfillmentNumber} has been cancelled.`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to cancel fulfillment');
    },
  });
}
