import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Send,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  Search,
  CheckCircle2,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import {
  useQuotationDetail,
  useQuotationApprovals,
  useQuotationDiscountEvaluation,
  useSubmitQuotationMutation,
  useAddQuotationItemMutation,
  useDeleteQuotationItemMutation,
  useSendQuotationMutation,
  useNegotiateQuotationMutation,
  useReviseQuotationMutation,
  useMarkQuotationWonMutation,
  useMarkQuotationLostMutation,
} from '../hooks/useQuotationsQuery';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { formatINR, formatPercent, formatDate } from '@/utils/formatters';

export const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const {
    data: quote,
    isLoading: isQuoteLoading,
    isError: isQuoteError,
    error: quoteError,
    refetch: refetchQuote,
  } = useQuotationDetail(id);

  const { data: approvals = [] } = useQuotationApprovals(id);
  const { data: evaluation } = useQuotationDiscountEvaluation(id);

  // Mutations
  const submitMutation = useSubmitQuotationMutation();
  const addItemMutation = useAddQuotationItemMutation();
  const deleteItemMutation = useDeleteQuotationItemMutation();
  const sendMutation = useSendQuotationMutation();
  const negotiateMutation = useNegotiateQuotationMutation();
  const reviseMutation = useReviseQuotationMutation();
  const markWonMutation = useMarkQuotationWonMutation();
  const markLostMutation = useMarkQuotationLostMutation();

  // Local State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isNegotiateModalOpen, setIsNegotiateModalOpen] = useState(false);
  const [negotiateNotes, setNegotiateNotes] = useState('');
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [reviseNotes, setReviseNotes] = useState('');
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [wonNotes, setWonNotes] = useState('');
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  const { data: productData, isLoading: isProductsLoading } = useProducts({
    search: debouncedProductSearch.trim() || undefined,
    limit: 15,
    isActive: true,
  });
  const products = productData?.items || [];

  const statusVariantMap: Record<
    string,
    'draft' | 'pending' | 'approved' | 'negotiating' | 'won' | 'rejected' | 'default'
  > = {
    DRAFT: 'draft',
    PENDING_MANAGER_APPROVAL: 'pending',
    PENDING_FINANCE_APPROVAL: 'pending',
    APPROVED: 'approved',
    SENT: 'negotiating',
    NEGOTIATION: 'negotiating',
    WON: 'won',
    LOST: 'rejected',
    REJECTED: 'rejected',
    CANCELLED: 'rejected',
    EXPIRED: 'default',
  };

  const statusLabelMap: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_MANAGER_APPROVAL: 'Pending Manager Approval',
    PENDING_FINANCE_APPROVAL: 'Pending Finance Approval',
    APPROVED: 'Approved by Governance',
    SENT: 'Sent to Customer',
    NEGOTIATION: 'In Negotiation',
    WON: 'Won / Contract Accepted',
    LOST: 'Lost / Closed',
    REJECTED: 'Rejected by Governance',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };

  if (isQuoteLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="h-9 w-9 animate-spin text-[#3568ed] mb-3" />
        <h3 className="text-base font-bold text-[#17213a]">Loading Quotation Details...</h3>
        <p className="text-xs text-[#71809f] mt-1">Connecting to backend CPQ and governance services.</p>
      </div>
    );
  }

  if (isQuoteError || !quote) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-[#17213a]">Quotation Not Found</h2>
        <p className="mt-1 text-sm text-[#71809f]">
          {(quoteError as Error)?.message || 'The requested quotation could not be loaded.'}
        </p>
        <div className="flex items-center gap-3 mt-5">
          <Button variant="outline" size="sm" onClick={() => refetchQuote()}>
            Retry
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/quotations')}>
            View All Quotations
          </Button>
        </div>
      </div>
    );
  }

  const isEditable = quote.status === 'DRAFT' || quote.status === 'REJECTED';
  const subtotalNum = parseFloat(String(quote.subtotal)) || 0;
  const discountNum = parseFloat(String(quote.discountAmount)) || 0;
  const totalNum = parseFloat(String(quote.totalAmount)) || 0;
  const items = quote.items || [];

  const handleConfirmSubmit = async () => {
    try {
      await submitMutation.mutateAsync({
        id: quote.id,
        payload: { notes: submitNotes.trim() || undefined },
      });
      setIsSubmitModalOpen(false);
      setSubmitNotes('');
    } catch (err) {
      console.error('Failed to submit quote:', err);
    }
  };

  const handleConfirmSend = async () => {
    try {
      await sendMutation.mutateAsync(quote.id);
      setIsSendModalOpen(false);
    } catch (err) {
      console.error('Failed to send quote:', err);
    }
  };

  const handleConfirmNegotiate = async () => {
    try {
      await negotiateMutation.mutateAsync({
        id: quote.id,
        payload: { notes: negotiateNotes.trim() || undefined },
      });
      setIsNegotiateModalOpen(false);
      setNegotiateNotes('');
    } catch (err) {
      console.error('Failed to move quote to negotiation:', err);
    }
  };

  const handleConfirmRevise = async () => {
    try {
      const revisedQuote = await reviseMutation.mutateAsync({
        id: quote.id,
        payload: { notes: reviseNotes.trim() || undefined },
      });
      setIsReviseModalOpen(false);
      setReviseNotes('');
      navigate(`/quotations/${revisedQuote.id}`);
    } catch (err) {
      console.error('Failed to create revised quote:', err);
    }
  };

  const handleConfirmWon = async () => {
    try {
      await markWonMutation.mutateAsync({
        id: quote.id,
        payload: { notes: wonNotes.trim() || undefined },
      });
      setIsWonModalOpen(false);
      setWonNotes('');
    } catch (err) {
      console.error('Failed to mark quote as won:', err);
    }
  };

  const handleConfirmLost = async () => {
    try {
      await markLostMutation.mutateAsync({
        id: quote.id,
        payload: { reason: lostReason.trim() || undefined },
      });
      setIsLostModalOpen(false);
      setLostReason('');
    } catch (err) {
      console.error('Failed to mark quote as lost:', err);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddItem = async () => {
    if (!selectedProductId) return;
    setAddItemError(null);

    if (
      selectedProduct?.stock !== undefined &&
      selectedProduct?.stock !== null &&
      itemQuantity > selectedProduct.stock
    ) {
      setAddItemError(
        `Insufficient stock: Requested quantity (${itemQuantity}) exceeds available stock (${selectedProduct.stock} units).`
      );
      return;
    }

    try {
      await addItemMutation.mutateAsync({
        quotationId: quote.id,
        payload: {
          productId: selectedProductId,
          quantity: itemQuantity,
          discountPercent: itemDiscount,
        },
      });
      setIsAddItemModalOpen(false);
      setSelectedProductId('');
      setItemQuantity(1);
      setItemDiscount(0);
      setAddItemError(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response?.data?.error?.message || (err as Error)?.message || 'Failed to add item';
      setAddItemError(msg);
      console.error('Failed to add item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItemMutation.mutateAsync({
        quotationId: quote.id,
        itemId,
      });
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/quotations')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            All Quotes
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
                {quote.quotationNumber}
              </h1>
              <Badge variant={statusVariantMap[quote.status] || 'default'}>
                {statusLabelMap[quote.status] || quote.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-[#59657d]">
              Customer: <strong>{quote.customer?.companyName || 'N/A'}</strong> • Created on{' '}
              {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Send to Customer (when Approved) */}
          {quote.status === 'APPROVED' && (
            <Button
              variant="primary"
              leftIcon={<Send className="h-4 w-4" />}
              disabled={sendMutation.isPending}
              onClick={() => setIsSendModalOpen(true)}
            >
              {sendMutation.isPending ? 'Sending...' : 'Send to Customer'}
            </Button>
          )}

          {/* When Sent to Customer: Move to Negotiation, Win, or Lose */}
          {quote.status === 'SENT' && (
            <>
              <Button
                variant="outline"
                leftIcon={<RefreshCw className="h-4 w-4 text-[#3568ed]" />}
                disabled={negotiateMutation.isPending}
                onClick={() => setIsNegotiateModalOpen(true)}
              >
                Client Wants Negotiation
              </Button>
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                leftIcon={<ThumbsUp className="h-4 w-4" />}
                disabled={markWonMutation.isPending}
                onClick={() => setIsWonModalOpen(true)}
              >
                Mark as Won
              </Button>
              <Button
                variant="outline"
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                leftIcon={<ThumbsDown className="h-4 w-4" />}
                disabled={markLostMutation.isPending}
                onClick={() => setIsLostModalOpen(true)}
              >
                Mark as Lost
              </Button>
            </>
          )}

          {/* When in Negotiation Layer: Revise Quotation, Win, or Lose */}
          {quote.status === 'NEGOTIATION' && (
            <>
              <Button
                variant="primary"
                leftIcon={<Copy className="h-4 w-4" />}
                disabled={reviseMutation.isPending}
                onClick={() => setIsReviseModalOpen(true)}
              >
                {reviseMutation.isPending ? 'Revising...' : 'Create Revised Quotation'}
              </Button>
              <Button
                variant="outline"
                className="text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                leftIcon={<ThumbsUp className="h-4 w-4" />}
                disabled={markWonMutation.isPending}
                onClick={() => setIsWonModalOpen(true)}
              >
                Mark as Won
              </Button>
              <Button
                variant="outline"
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                leftIcon={<ThumbsDown className="h-4 w-4" />}
                disabled={markLostMutation.isPending}
                onClick={() => setIsLostModalOpen(true)}
              >
                Mark as Lost
              </Button>
            </>
          )}

          {/* Submit for Approval (when Draft or Rejected) */}
          {isEditable && (
            <Button
              variant="primary"
              leftIcon={<Send className="h-4 w-4" />}
              disabled={items.length === 0 || submitMutation.isPending}
              onClick={() => setIsSubmitModalOpen(true)}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          )}
        </div>
      </div>

      {/* Contextual Status Alerts & Action Banners */}
      {quote.status === 'NEGOTIATION' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4 text-xs text-blue-900 flex items-start justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 animate-spin-slow" />
            <div>
              <h4 className="font-bold text-sm text-blue-950">Quotation in Negotiation Layer</h4>
              <p className="mt-0.5 text-blue-800 leading-relaxed">
                The client has requested price or contract negotiations on this proposal. Sales Managers can create a revised quotation (e.g. <strong>{quote.quotationNumber}-R1</strong>), adjust line item discounts or quantities, and re-submit it into the discount approval workflow.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="shrink-0"
            leftIcon={<Copy className="h-3.5 w-3.5" />}
            onClick={() => setIsReviseModalOpen(true)}
          >
            Revise Quote
          </Button>
        </div>
      )}

      {quote.status === 'SENT' && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-4 text-xs text-purple-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Send className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-purple-950">Quotation Sent to Customer</h4>
              <p className="mt-0.5 text-purple-800 leading-relaxed">
                This quotation is currently under customer review. If the client accepts the terms, click <strong>Mark as Won</strong>. If the client requests changes or discounts, click <strong>Client Wants Negotiation</strong> to transition to the Negotiation Layer.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-purple-100/70 border-purple-300 text-purple-900 shrink-0"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => setIsNegotiateModalOpen(true)}
          >
            Start Negotiation
          </Button>
        </div>
      )}

      {quote.status === 'WON' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-emerald-950">Deal Won &amp; Contract Finalized</h4>
            <p className="mt-0.5 text-emerald-800 leading-relaxed">
              This quotation has been officially accepted by the customer. Stock has been confirmed and commercial terms are finalized.
            </p>
          </div>
        </div>
      )}

      {quote.status === 'LOST' && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-rose-950">Deal Closed / Lost</h4>
            <p className="mt-0.5 text-rose-800 leading-relaxed">
              This deal was not won. You can review customer feedback in proposal notes or create a new quotation when the account re-engages.
            </p>
          </div>
        </div>
      )}

      {/* Rejection Banner if status is REJECTED */}
      {quote.status === 'REJECTED' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Quotation Rejected by Governance</h4>
            <p className="mt-0.5 text-red-700">
              This quotation was rejected during approval review. You can adjust the line items, reduce discounts, and re-submit for review.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Header */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview & Line Items', icon: <FileText className="h-4 w-4" /> },
          {
            id: 'approvals',
            label: 'Approval Chain',
            icon: <ShieldCheck className="h-4 w-4" />,
            badge: approvals.length > 0 ? (
              <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-[#3568ed]">
                {approvals.length}
              </span>
            ) : undefined,
          },
          {
            id: 'governance',
            label: 'Governance & Risk Diagnostics',
            icon: <AlertTriangle className="h-4 w-4" />,
            badge: evaluation?.approvalRequired ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                Review Required
              </span>
            ) : undefined,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: Overview & Line Items */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            {/* Line Items Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Contract Line Items</CardTitle>
                    <p className="text-xs text-[#71809f] mt-0.5">
                      Configured items and live prices resolved by backend CPQ engine.
                    </p>
                  </div>
                  {isEditable && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => setIsAddItemModalOpen(true)}
                    >
                      Add Item
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-semibold text-gray-600">No line items on this quotation</p>
                    {isEditable && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Click &ldquo;Add Item&rdquo; above to attach products.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 bg-[#fbfcfe] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                          <th className="py-2.5 px-4 font-semibold">Product</th>
                          <th className="py-2.5 font-semibold text-center">Available Stock</th>
                          <th className="py-2.5 font-semibold text-right">Unit Price</th>
                          <th className="py-2.5 font-semibold text-center">Qty</th>
                          <th className="py-2.5 font-semibold text-center">Discount %</th>
                          <th className="py-2.5 font-semibold text-right">Net Amount</th>
                          {isEditable && <th className="py-2.5 px-4 font-semibold text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item) => {
                          const unitPriceNum = parseFloat(String(item.unitPrice)) || 0;
                          const discountNum = parseFloat(String(item.discountPercent)) || 0;
                          const netAmountNum = parseFloat(String(item.netAmount)) || 0;
                          const matchedProduct = products.find((p) => p.id === item.productId);
                          const stockCount = matchedProduct?.stock;

                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4">
                                <p className="font-semibold text-[#17213a]">{item.productNameSnapshot}</p>
                                <span className="text-[10px] text-gray-400">SKU: {item.skuSnapshot}</span>
                              </td>
                              <td className="py-3 text-center">
                                {stockCount === undefined ? (
                                  <span className="text-gray-400 font-medium text-[10px]">In Stock</span>
                                ) : stockCount === 0 ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                    Out of Stock (0)
                                  </span>
                                ) : item.quantity > stockCount ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                    ⚠️ Exceeds ({stockCount})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {stockCount} in stock
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right font-medium text-[#17213a]">
                                {formatINR(unitPriceNum)}
                              </td>
                              <td className="py-3 text-center font-bold text-[#17213a]">
                                {item.quantity}
                              </td>
                              <td className="py-3 text-center">
                                {discountNum > 0 ? (
                                  <span className="font-semibold text-amber-700">
                                    {formatPercent(discountNum)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">0%</span>
                                )}
                              </td>
                              <td className="py-3 text-right font-bold text-[#17213a]">
                                {formatINR(netAmountNum)}
                              </td>
                              {isEditable && (
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                                    title="Delete line"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {quote.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Customer & Financial Summary */}
          <div className="space-y-6">
            {/* Financial Totals Card */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Subtotal Amount:</span>
                  <span className="font-semibold text-[#17213a]">{formatINR(subtotalNum)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Applied Discount:</span>
                  <span className="font-semibold text-amber-600">
                    -{formatINR(discountNum)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-[#17213a]">Total Amount:</span>
                  <span className="text-lg font-bold text-[#3568ed]">
                    {formatINR(totalNum)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Currency:</span>
                  <span className="font-semibold uppercase">{quote.currency}</span>
                </div>
              </CardContent>
            </Card>

            {/* Account & Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account &amp; Commercial Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Customer</span>
                  <p className="font-bold text-[#17213a] mt-0.5">
                    {quote.customer?.companyName || 'Unassigned'}
                  </p>
                  <p className="text-gray-500 text-[11px]">{quote.customer?.email}</p>
                </div>

                {quote.customer?.customerTier && (
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Tier Level</span>
                    <Badge variant="gold" size="sm" className="mt-1">
                      {quote.customer.customerTier.name}
                    </Badge>
                  </div>
                )}

                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Commercial Price List</span>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {quote.priceList?.name || 'Standard Price List'}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Sales Representative</span>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {quote.createdByUser?.name || 'Assigned Representative'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="text-gray-500">Valid Until:</span>
                  <strong className="text-gray-800">{formatDate(quote.expiryDate)}</strong>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Live Approval Audit Trail */}
      {activeTab === 'approvals' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Approval Workflow &amp; Audit Trail</CardTitle>
              <p className="mt-0.5 text-xs text-[#71809f]">
                Multi-tier signoff status generated by discount governance rules.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            {approvals.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <ShieldCheck className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-700">No approval steps generated yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  When submitted, the discount engine will evaluate line items and route approvals accordingly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvals.map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[#17213a]">
                          Sequence {step.sequence}: {step.approvalLevel === 'MANAGER' ? 'Sales Manager Review' : 'Finance & Commercial Director Review'}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Requested on {formatDate(step.requestedAt || step.createdAt)}
                        </p>
                        {step.comments && (
                          <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-700 border border-gray-100">
                            <strong>Note:</strong> {step.comments}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-0 text-right">
                      <Badge
                        variant={
                          step.status === 'APPROVED'
                            ? 'success'
                            : step.status === 'REJECTED'
                            ? 'danger'
                            : 'pending'
                        }
                      >
                        {step.status}
                      </Badge>
                      {step.decidedAt && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Decided on {formatDate(step.decidedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Governance & Risk Diagnostics */}
      {activeTab === 'governance' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Discount Governance &amp; Risk Diagnostics</CardTitle>
              <p className="mt-0.5 text-xs text-[#71809f]">
                Evaluated against price books, customer tier discount ceilings, and category rules.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {evaluation ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Approval Route</span>
                    <p className="text-sm font-bold text-[#17213a] mt-1">
                      {evaluation.approvalRoute.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Risk Score</span>
                    <p className="text-sm font-bold text-[#3568ed] mt-1">
                      {evaluation.riskScore}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Total Violations</span>
                    <p className="text-sm font-bold text-amber-700 mt-1">
                      {evaluation.totalViolations} line(s)
                    </p>
                  </div>
                </div>

                {/* Line Item Diagnostics Table */}
                {evaluation.lineEvaluations && evaluation.lineEvaluations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#17213a] mb-2.5">
                      Line Item Governance Analysis
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500">
                            <th className="py-2.5 px-3">Product</th>
                            <th className="py-2.5 text-center">Applied %</th>
                            <th className="py-2.5 text-center">Tier Limit %</th>
                            <th className="py-2.5 text-center">Category Limit %</th>
                            <th className="py-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {evaluation.lineEvaluations.map((line) => (
                            <tr key={line.quotationItemId} className="hover:bg-gray-50/50">
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-[#17213a]">{line.productName}</span>
                                <span className="text-[10px] text-gray-400 block">{line.categoryName}</span>
                              </td>
                              <td className="py-2.5 text-center font-bold text-[#17213a]">
                                {line.appliedDiscount}%
                              </td>
                              <td className="py-2.5 text-center text-gray-600">
                                {line.customerTierLimit}%
                              </td>
                              <td className="py-2.5 text-center text-gray-600">
                                {line.categoryLimit}%
                              </td>
                              <td className="py-2.5 text-center">
                                {line.isViolation ? (
                                  <Badge variant="warning" size="sm">
                                    Exceeds Limit
                                  </Badge>
                                ) : (
                                  <Badge variant="success" size="sm">
                                    Within Policy
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-xs text-gray-400">
                Governance diagnostics will be computed upon line item evaluation or submission.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit for Approval Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Quotation for Approval"
        description="This will lock the quotation and route it into the discount approval workflow."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1">
              Submission Notes / Commercial Justification
            </label>
            <textarea
              rows={3}
              value={submitNotes}
              onChange={(e) => setSubmitNotes(e.target.value)}
              placeholder="e.g., Annual enterprise contract with upfront quarterly commitments..."
              className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={submitMutation.isPending}
              onClick={handleConfirmSubmit}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Confirm Submission'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setProductSearch('');
          setSelectedProductId('');
          setAddItemError(null);
        }}
        title="Add Line Item"
        description="Search and select a product from the live catalog to add to this quotation."
        maxWidth="md"
      >
        <div className="space-y-4">
          {addItemError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{addItemError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1">
              Search &amp; Select Product
            </label>
            <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white mb-2 transition">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
              />
              {isProductsLoading && (
                <RefreshCw className="h-3 w-3 animate-spin text-[#3568ed]" />
              )}
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white">
              {isProductsLoading && products.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">Searching products...</div>
              ) : products.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">No products found</div>
              ) : (
                products.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  const stock = p.stock;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setAddItemError(null);
                      }}
                      className={`flex items-center justify-between p-2.5 text-xs cursor-pointer transition ${
                        isSelected ? 'bg-blue-50/80 border-l-4 border-l-[#3568ed]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className={`font-semibold ${isSelected ? 'text-[#3568ed]' : 'text-[#17213a]'}`}>
                            {p.name}
                          </p>
                          {stock !== undefined && (
                            stock === 0 ? (
                              <span className="rounded-full bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[9px] font-bold text-rose-700">
                                Out of stock (0)
                              </span>
                            ) : stock <= 10 ? (
                              <span className="rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                                {stock} left
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                                {stock} in stock
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">
                          SKU: {p.sku} • {p.category?.name || 'General'}
                        </p>
                      </div>
                      <span className="font-bold text-[#17213a]">
                        {formatINR(parseFloat(String(p.basePrice)) || 0)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#475467]">Quantity</label>
                {selectedProduct?.stock !== undefined && (
                  <span className={`text-[10px] font-semibold ${selectedProduct.stock === 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                    Available: {selectedProduct.stock}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => {
                  setItemQuantity(parseInt(e.target.value, 10) || 1);
                  setAddItemError(null);
                }}
                className={`w-full rounded-xl border p-2 text-xs text-[#17213a] focus:outline-none ${
                  selectedProduct?.stock !== undefined && itemQuantity > selectedProduct.stock
                    ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500'
                    : 'border-gray-200 focus:border-[#3568ed]'
                }`}
              />
              {selectedProduct?.stock !== undefined && itemQuantity > selectedProduct.stock && (
                <p className="text-[10px] font-bold text-rose-600 mt-1">
                  Requested {itemQuantity} exceeds stock ({selectedProduct.stock})
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#475467] mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={itemDiscount}
                onChange={(e) => setItemDiscount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddItemModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedProductId || addItemMutation.isPending}
              onClick={handleAddItem}
            >
              {addItemMutation.isPending ? 'Adding...' : 'Add to Quotation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Send to Customer Modal */}
      <Modal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Send Quotation to Customer"
        description="Mark this quotation as delivered to the customer for review."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-700">
            This will transition quotation <strong>{quote.quotationNumber}</strong> to <strong>Sent to Customer</strong> status.
            The client can review terms, accept the quote, or request counter-offer negotiations.
          </p>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={sendMutation.isPending}
              onClick={handleConfirmSend}
            >
              {sendMutation.isPending ? 'Sending...' : 'Confirm Send'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move to Negotiation Modal */}
      <Modal
        isOpen={isNegotiateModalOpen}
        onClose={() => {
          setIsNegotiateModalOpen(false);
          setNegotiateNotes('');
        }}
        title="Move to Negotiation Layer"
        description="Record client counter-offer details and move this quotation into active negotiation."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1">
              Client Counter-Offer / Negotiation Notes
            </label>
            <textarea
              rows={3}
              value={negotiateNotes}
              onChange={(e) => setNegotiateNotes(e.target.value)}
              placeholder="e.g., Client requested an extra 5% volume discount for a 2-year upfront commitment..."
              className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsNegotiateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={negotiateMutation.isPending}
              onClick={handleConfirmNegotiate}
            >
              {negotiateMutation.isPending ? 'Moving...' : 'Move to Negotiation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Revised Quotation Modal */}
      <Modal
        isOpen={isReviseModalOpen}
        onClose={() => {
          setIsReviseModalOpen(false);
          setReviseNotes('');
        }}
        title="Create Revised Quotation"
        description="Generate a new revision draft from this quotation to adjust pricing or terms."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-700">
            A new revision draft (e.g. <strong>{quote.quotationNumber}-R1</strong>) will be created with all line items, customer details, and price book copied. You will be redirected to the new draft to adjust discounts and submit for discount approval.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1">
              Revision Notes / Rationale (Optional)
            </label>
            <textarea
              rows={3}
              value={reviseNotes}
              onChange={(e) => setReviseNotes(e.target.value)}
              placeholder="e.g., Adjusted discount to 14% to meet client counter-offer..."
              className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsReviseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={reviseMutation.isPending}
              onClick={handleConfirmRevise}
            >
              {reviseMutation.isPending ? 'Creating Revision...' : 'Create Revision & Open Draft'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark Won Modal */}
      <Modal
        isOpen={isWonModalOpen}
        onClose={() => {
          setIsWonModalOpen(false);
          setWonNotes('');
        }}
        title="Mark Deal as Won"
        description="Record acceptance of this quotation and finalize the commercial contract."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1">
              Closing Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={wonNotes}
              onChange={(e) => setWonNotes(e.target.value)}
              placeholder="e.g., Signed contract received. Payment terms agreed to Net 30."
              className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsWonModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
              disabled={markWonMutation.isPending}
              onClick={handleConfirmWon}
            >
              {markWonMutation.isPending ? 'Saving...' : 'Confirm Deal Won'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark Lost Modal */}
      <Modal
        isOpen={isLostModalOpen}
        onClose={() => {
          setIsLostModalOpen(false);
          setLostReason('');
        }}
        title="Mark Deal as Lost"
        description="Close this quotation as lost and record the loss reason."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1">
              Reason for Loss
            </label>
            <textarea
              rows={3}
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="e.g., Budget postponed to next fiscal year, or selected competitor..."
              className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsLostModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
              disabled={markLostMutation.isPending}
              onClick={handleConfirmLost}
            >
              {markLostMutation.isPending ? 'Closing...' : 'Confirm Deal Lost'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
