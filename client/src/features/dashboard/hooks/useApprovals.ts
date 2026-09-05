import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { approvalsApi, BackendPendingApprovalItem } from '../api/approvalsApi';
import { PendingApproval } from '../types';

function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹ 0';
  return '₹ ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export function mapBackendApprovalToUI(item: BackendPendingApprovalItem): PendingApproval {
  const quote = item.quotation;
  const rawAmount = quote?.totalAmount ? parseFloat(quote.totalAmount) : 0;
  const subtotal = quote?.subtotal ? parseFloat(quote.subtotal) : 0;
  const discountAmount = quote?.discountAmount ? parseFloat(quote.discountAmount) : 0;

  // Derive discount percent from item or subtotal calculation
  let requestedDiscount = 0;
  if (quote?.discountPercent) {
    requestedDiscount = parseFloat(quote.discountPercent);
  } else if (subtotal > 0 && discountAmount > 0) {
    requestedDiscount = Math.round((discountAmount / subtotal) * 1000) / 10;
  }

  return {
    id: item.id,
    quotationNumber: quote?.quotationNumber || `QT-${item.quotationId.slice(0, 6).toUpperCase()}`,
    customerName: quote?.customer?.companyName || 'Enterprise Account',
    repName: quote?.createdBy?.name || 'Sales Representative',
    repEmail: quote?.createdBy?.email || 'sales.rep@dealflow360.io',
    amount: formatINR(rawAmount),
    amountRaw: rawAmount,
    requestedDiscount,
    maxRepLimit: 10.0,
    reason: item.comments || 'Discount requested above standard representative delegated authority (10%).',
    submittedAt: formatRelativeTime(item.requestedAt),
    status: (item.status.toLowerCase() as 'pending' | 'approved' | 'rejected') || 'pending',
  };
}

export function useApprovals() {
  const queryClient = useQueryClient();

  // Query: Live Pending Approvals
  const {
    data: rawApprovals = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: approvalsApi.fetchPendingApprovals,
    staleTime: 1000 * 30, // 30 seconds fresh
    refetchOnWindowFocus: true,
  });

  const approvals: PendingApproval[] = rawApprovals.map(mapBackendApprovalToUI);

  // Mutation: Approve
  const approveMutation = useMutation({
    mutationFn: async ({ approvalId, comments }: { approvalId: string; comments?: string }) => {
      return approvalsApi.approveApproval(approvalId, comments);
    },
    onMutate: async ({ approvalId }) => {
      await queryClient.cancelQueries({ queryKey: ['approvals', 'pending'] });

      const previousApprovals = queryClient.getQueryData<BackendPendingApprovalItem[]>(['approvals', 'pending']);

      if (previousApprovals) {
        queryClient.setQueryData<BackendPendingApprovalItem[]>(
          ['approvals', 'pending'],
          previousApprovals.filter((item) => item.id !== approvalId)
        );
      }

      return { previousApprovals };
    },
    onSuccess: (data, variables) => {
      const quoteStatus = data.quotationStatus || 'APPROVED';
      toast.success(`Approval confirmed! Quotation is now ${quoteStatus}.`, {
        id: `approve-success-${variables.approvalId}`,
      });
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousApprovals) {
        queryClient.setQueryData(['approvals', 'pending'], context.previousApprovals);
      }
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to process approval';
      toast.error(`Approval failed: ${errorMessage}`, {
        id: 'approve-error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Mutation: Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ approvalId, comments }: { approvalId: string; comments: string }) => {
      return approvalsApi.rejectApproval(approvalId, comments);
    },
    onMutate: async ({ approvalId }) => {
      await queryClient.cancelQueries({ queryKey: ['approvals', 'pending'] });

      const previousApprovals = queryClient.getQueryData<BackendPendingApprovalItem[]>(['approvals', 'pending']);

      if (previousApprovals) {
        queryClient.setQueryData<BackendPendingApprovalItem[]>(
          ['approvals', 'pending'],
          previousApprovals.filter((item) => item.id !== approvalId)
        );
      }

      return { previousApprovals };
    },
    onSuccess: (_, variables) => {
      toast.error(`Quotation discount rejected. Sales Rep notified.`, {
        id: `reject-success-${variables.approvalId}`,
      });
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousApprovals) {
        queryClient.setQueryData(['approvals', 'pending'], context.previousApprovals);
      }
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reject discount request';
      toast.error(`Rejection failed: ${errorMessage}`, {
        id: 'reject-error',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    approvals,
    rawApprovals,
    isLoading,
    isError,
    error,
    refetch,
    // Action triggers
    approve: (approvalId: string, comments?: string) =>
      approveMutation.mutateAsync({ approvalId, comments }),
    reject: (approvalId: string, comments: string) =>
      rejectMutation.mutateAsync({ approvalId, comments }),
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isProcessing: approveMutation.isPending || rejectMutation.isPending,
  };
}

export default useApprovals;
