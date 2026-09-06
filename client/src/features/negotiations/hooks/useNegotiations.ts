import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  negotiationsApi,
  NegotiationQueryParams,
} from '../api/negotiationsApi';

export const NEGOTIATIONS_QUERY_KEYS = {
  all: ['negotiations'] as const,
  lists: () => [...NEGOTIATIONS_QUERY_KEYS.all, 'list'] as const,
  list: (params?: NegotiationQueryParams) => [...NEGOTIATIONS_QUERY_KEYS.lists(), params] as const,
  details: () => [...NEGOTIATIONS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id?: string) => [...NEGOTIATIONS_QUERY_KEYS.details(), id] as const,
};

export const useNegotiationsQuery = (params?: NegotiationQueryParams) => {
  return useQuery({
    queryKey: NEGOTIATIONS_QUERY_KEYS.list(params),
    queryFn: () => negotiationsApi.getNegotiations(params),
    staleTime: 10 * 1000,
  });
};

export const useNegotiationDetail = (id?: string) => {
  return useQuery({
    queryKey: NEGOTIATIONS_QUERY_KEYS.detail(id),
    queryFn: () => negotiationsApi.getNegotiationById(id!),
    enabled: Boolean(id),
  });
};

export const useDeclineNegotiationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, repResponse }: { id: string; repResponse: string }) =>
      negotiationsApi.declineNegotiation(id, repResponse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEGOTIATIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
};

export const useCreateRevisionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => negotiationsApi.createRevision(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEGOTIATIONS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
};
