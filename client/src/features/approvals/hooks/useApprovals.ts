import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '../api/approvalsApi';
import {
  PendingApprovalsQueryParams,
  ApprovePayload,
  RejectPayload,
} from '../types/approval.types';

export const approvalKeys = {
  all: ['approvals'] as const,
  pending: (params?: PendingApprovalsQueryParams) => [...approvalKeys.all, 'pending', params] as const,
};

export function usePendingApprovals(params?: PendingApprovalsQueryParams) {
  return useQuery({
    queryKey: approvalKeys.pending(params),
    queryFn: () => approvalsApi.getPendingApprovals(params),
    staleTime: 1000 * 30,
  });
}

export function useApproveApprovalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ApprovePayload }) =>
      approvalsApi.approveApproval(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useRejectApprovalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectPayload }) =>
      approvalsApi.rejectApproval(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}
