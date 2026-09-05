import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { quotationsApi } from '../api/quotationsApi';
import {
  QuotationQueryParams,
  CreateQuotationPayload,
  UpdateQuotationPayload,
  AddQuotationItemPayload,
  UpdateQuotationItemPayload,
  SubmitQuotationPayload,
} from '../types/quotationApi.types';

export const quotationKeys = {
  all: ['quotations'] as const,
  lists: () => [...quotationKeys.all, 'list'] as const,
  list: (params?: QuotationQueryParams) => [...quotationKeys.lists(), params] as const,
  details: () => [...quotationKeys.all, 'detail'] as const,
  detail: (id: string) => [...quotationKeys.details(), id] as const,
  approvals: (id: string) => [...quotationKeys.detail(id), 'approvals'] as const,
  evaluation: (id: string) => [...quotationKeys.detail(id), 'evaluation'] as const,
};

// Hook: List Quotations with high performance caching & seamless pagination
export function useQuotationsList(params?: QuotationQueryParams) {
  return useQuery({
    queryKey: quotationKeys.list(params),
    queryFn: () => quotationsApi.getQuotations(params),
    staleTime: 1000 * 60, // 60 seconds fresh
    gcTime: 1000 * 60 * 5, // 5 minutes cache retention
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false, // Prevent redundant background fetches on tab clicks
  });
}

// Hook: Single Quotation Detail with populated lines & customer
export function useQuotationDetail(id: string | undefined) {
  return useQuery({
    queryKey: quotationKeys.detail(id || ''),
    queryFn: () => quotationsApi.getQuotationById(id!),
    enabled: Boolean(id),
  });
}

// Hook: Quotation Approvals
export function useQuotationApprovals(id: string | undefined) {
  return useQuery({
    queryKey: quotationKeys.approvals(id || ''),
    queryFn: () => quotationsApi.getApprovals(id!),
    enabled: Boolean(id),
  });
}

// Hook: Discount Governance Evaluation
export function useQuotationDiscountEvaluation(id: string | undefined) {
  return useQuery({
    queryKey: quotationKeys.evaluation(id || ''),
    queryFn: () => quotationsApi.getDiscountEvaluation(id!),
    enabled: Boolean(id),
  });
}

// Mutation: Create Quotation Header
export function useCreateQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuotationPayload) => quotationsApi.createQuotation(payload),
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.setQueryData(quotationKeys.detail(newQuote.id), newQuote);
    },
  });
}

// Mutation: Update Quotation Header
export function useUpdateQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateQuotationPayload }) =>
      quotationsApi.updateQuotation(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.setQueryData(quotationKeys.detail(updated.id), updated);
    },
  });
}

// Mutation: Add Item to Quotation
export function useAddQuotationItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quotationId,
      payload,
    }: {
      quotationId: string;
      payload: AddQuotationItemPayload;
    }) => quotationsApi.addItem(quotationId, payload),
    onSuccess: (_, { quotationId }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quotationKeys.evaluation(quotationId) });
    },
  });
}

// Mutation: Update Item
export function useUpdateQuotationItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quotationId,
      itemId,
      payload,
    }: {
      quotationId: string;
      itemId: string;
      payload: UpdateQuotationItemPayload;
    }) => quotationsApi.updateItem(quotationId, itemId, payload),
    onSuccess: (_, { quotationId }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quotationKeys.evaluation(quotationId) });
    },
  });
}

// Mutation: Delete Item
export function useDeleteQuotationItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotationId, itemId }: { quotationId: string; itemId: string }) =>
      quotationsApi.deleteItem(quotationId, itemId),
    onSuccess: (_, { quotationId }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quotationKeys.evaluation(quotationId) });
    },
  });
}

// Mutation: Submit Quotation for Approval
export function useSubmitQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: SubmitQuotationPayload }) =>
      quotationsApi.submitQuotation(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quotationKeys.approvals(id) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.evaluation(id) });
      queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] });
    },
  });
}

// Mutation: Cancel Quotation
export function useCancelQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotationsApi.cancelQuotation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['kanban-column'] });
    },
  });
}

// Mutation: Send Quotation to Customer
export function useSendQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotationsApi.sendQuotation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['kanban-column'] });
    },
  });
}

// Mutation: Move Quotation into Negotiation
export function useNegotiateQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: { notes?: string; requestedDiscountPercent?: number };
    }) => quotationsApi.negotiateQuotation(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['kanban-column'] });
    },
  });
}

// Mutation: Create Revised Quotation
export function useReviseQuotationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { notes?: string } }) =>
      quotationsApi.reviseQuotation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['kanban-column'] });
    },
  });
}

// Mutation: Mark Quotation as Won
export function useMarkQuotationWonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { notes?: string } }) =>
      quotationsApi.markQuotationWon(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['kanban-column'] });
    },
  });
}

// Mutation: Mark Quotation as Lost
export function useMarkQuotationLostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: { reason?: string; notes?: string };
    }) => quotationsApi.markQuotationLost(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['kanban-column'] });
    },
  });
}

