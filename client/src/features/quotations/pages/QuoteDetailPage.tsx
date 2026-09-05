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
} from '../hooks/useQuotationsQuery';
import { useProducts } from '@/features/products/hooks/useProducts';
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
  const { data: productData } = useProducts({ isActive: true });
  const products = productData?.items || [];

  // Mutations
  const submitMutation = useSubmitQuotationMutation();
  const addItemMutation = useAddQuotationItemMutation();
  const deleteItemMutation = useDeleteQuotationItemMutation();

  // Local State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);

  const statusVariantMap: Record<
    string,
    'draft' | 'pending' | 'approved' | 'negotiating' | 'won' | 'rejected' | 'default'
  > = {
    DRAFT: 'draft',
    PENDING_MANAGER_APPROVAL: 'pending',
    PENDING_FINANCE_APPROVAL: 'pending',
    APPROVED: 'approved',
    SENT: 'negotiating',
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

  const handleAddItem = async () => {
    if (!selectedProductId) return;
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
    } catch (err) {
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
        <div className="flex items-center gap-2.5">
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

      {/* Rejection / Action Banner if status is REJECTED */}
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

                          return (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4">
                                <p className="font-semibold text-[#17213a]">{item.productNameSnapshot}</p>
                                <span className="text-[10px] text-gray-400">SKU: {item.skuSnapshot}</span>
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
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add Line Item"
        description="Select a product from the live catalog to add to this quotation."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#475467] mb-1">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatINR(parseFloat(String(p.basePrice)) || 0)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#475467] mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              />
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
    </div>
  );
};
