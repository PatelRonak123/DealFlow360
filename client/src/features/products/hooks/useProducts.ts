import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productApi, ProductQueryParams } from '../api/productApi';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ProductQueryParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  priceLists: () => ['priceLists'] as const,
  categories: () => ['productCategories'] as const,
};

export function useProducts(params?: ProductQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.getProducts(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id || ''),
    queryFn: () => productApi.getProductById(id!),
    enabled: Boolean(id),
  });
}

export function usePriceLists() {
  return useQuery({
    queryKey: productKeys.priceLists(),
    queryFn: () => productApi.getPriceLists(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productApi.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
