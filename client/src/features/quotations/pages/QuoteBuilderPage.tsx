import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Package,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowLeft,
  Search,
  RefreshCw,
  Send,
  FileText,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CustomerSearchCombobox } from '@/features/customers/components/CustomerSearchCombobox';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts, usePriceLists } from '@/features/products/hooks/useProducts';
import { useCreateQuotationMutation } from '../hooks/useQuotationsQuery';
import { BackendProductSummary } from '../types/quotationApi.types';
import { formatINR, formatPercent } from '@/utils/formatters';

export interface CrossSellRecommendation {
  product: BackendProductSummary;
  recommendationType: 'CROSS_SELL' | 'UPSELL';
  title: string;
  rationale: string;
  expectedMarginBoost: number;
  confidenceScore: number;
  defaultQuantity: number;
}

export function deriveCrossSellRecommendations(
  currentLineItems: BuilderLineItem[],
  allProducts: BackendProductSummary[]
): CrossSellRecommendation[] {
  if (currentLineItems.length === 0 || allProducts.length === 0) return [];

  const existingProductIds = new Set(currentLineItems.map((i) => i.product.id));

  const hasHardware = currentLineItems.some(
    (i) =>
      i.product.category?.name?.toLowerCase().includes('hardware') ||
      i.product.productType === 'ONE_TIME' ||
      i.product.sku?.toUpperCase().startsWith('HW-') ||
      ['server', 'switch', 'gateway', 'edge', 'blade', 'core'].some((w) =>
        i.product.name?.toLowerCase().includes(w)
      )
  );

  const hasSoftware = currentLineItems.some(
    (i) =>
      i.product.category?.name?.toLowerCase().includes('software') ||
      i.product.productType === 'RECURRING' ||
      i.product.sku?.toUpperCase().startsWith('SW-') ||
      ['platform', 'license', 'software', 'cpq'].some((w) =>
        i.product.name?.toLowerCase().includes(w)
      )
  );

  const recommendations: CrossSellRecommendation[] = [];

  // 1. Hardware triggers: Recommend 24/7 SLA & Warranty and/or Onsite Deployment
  if (hasHardware) {
    const slaProduct = allProducts.find(
      (p) =>
        !existingProductIds.has(p.id) &&
        (p.sku?.toUpperCase().includes('SLA') ||
          p.sku?.toUpperCase().includes('SVC-SLA') ||
          p.name.toLowerCase().includes('sla') ||
          p.name.toLowerCase().includes('mission-critical') ||
          p.name.toLowerCase().includes('warranty'))
    );
    if (slaProduct) {
      recommendations.push({
        product: slaProduct,
        recommendationType: 'CROSS_SELL',
        title: '24/7 Mission-Critical SLA & Replacement Support',
        rationale:
          '92% of enterprise hardware buyers attach 24/7 Mission-Critical SLA to guarantee 4-hour hardware replacement and dedicated TAM.',
        expectedMarginBoost: 4.8,
        confidenceScore: 95,
        defaultQuantity: 1,
      });
    }

    const deployProduct = allProducts.find(
      (p) =>
        !existingProductIds.has(p.id) &&
        (p.sku?.toUpperCase().includes('DEPLOY') ||
          p.name.toLowerCase().includes('deployment') ||
          p.name.toLowerCase().includes('commissioning') ||
          p.name.toLowerCase().includes('installation'))
    );
    if (deployProduct) {
      recommendations.push({
        product: deployProduct,
        recommendationType: 'CROSS_SELL',
        title: 'Onsite Deployment & White-Glove Commissioning',
        rationale:
          'Attach turnkey onsite engineering deployment to eliminate customer installation friction and guarantee milestone signoff.',
        expectedMarginBoost: 3.2,
        confidenceScore: 89,
        defaultQuantity: 1,
      });
    }
  }

  // 2. Software triggers: Recommend AI Anomaly Detection & ERP Connector
  if (hasSoftware) {
    const aiProduct = allProducts.find(
      (p) =>
        !existingProductIds.has(p.id) &&
        (p.sku?.toUpperCase().includes('ANOMALY') ||
          p.sku?.toUpperCase().includes('AI') ||
          p.name.toLowerCase().includes('anomaly') ||
          p.name.toLowerCase().includes('predictive') ||
          p.name.toLowerCase().includes('ai'))
    );
    if (aiProduct) {
      recommendations.push({
        product: aiProduct,
        recommendationType: 'UPSELL',
        title: 'AI Predictive Deal Anomaly & Margin Optimizer',
        rationale:
          'Complement CPQ with AI Anomaly Detection for real-time margin risk warnings, win-rate prediction, and automated discount guidance.',
        expectedMarginBoost: 5.5,
        confidenceScore: 92,
        defaultQuantity: 1,
      });
    }

    const erpProduct = allProducts.find(
      (p) =>
        !existingProductIds.has(p.id) &&
        (p.sku?.toUpperCase().includes('ERP') ||
          p.sku?.toUpperCase().includes('INTEG') ||
          p.name.toLowerCase().includes('erp') ||
          p.name.toLowerCase().includes('sap') ||
          p.name.toLowerCase().includes('connector'))
    );
    if (erpProduct) {
      recommendations.push({
        product: erpProduct,
        recommendationType: 'CROSS_SELL',
        title: 'Custom ERP / SAP Connector Sprint',
        rationale:
          'Accelerate quote-to-cash velocity with direct 2-way automated synchronization between DealFlow360 quotes and customer ERP/SAP systems.',
        expectedMarginBoost: 4.0,
        confidenceScore: 85,
        defaultQuantity: 1,
      });
    }
  }

  // 3. Fallback / Generic: Pick any high-value services/recurring item or other products from allProducts not yet added
  if (recommendations.length === 0) {
    const candidateProducts = allProducts.filter((p) => !existingProductIds.has(p.id));
    const sortedCandidates = [...candidateProducts].sort((a, b) => {
      const aScore = a.productType === 'SERVICE' || a.productType === 'RECURRING' ? 2 : 1;
      const bScore = b.productType === 'SERVICE' || b.productType === 'RECURRING' ? 2 : 1;
      return bScore - aScore;
    });

    for (const cand of sortedCandidates.slice(0, 3)) {
      recommendations.push({
        product: cand,
        recommendationType:
          cand.productType === 'RECURRING' || cand.productType === 'SERVICE' ? 'CROSS_SELL' : 'UPSELL',
        title: cand.name,
        rationale:
          cand.productType === 'SERVICE' || cand.productType === 'RECURRING'
            ? 'High-margin recurring service add-on frequently co-termed with enterprise contracts to maximize recurring ARR.'
            : 'Frequently co-purchased with selected items to complete solution deployment specifications.',
        expectedMarginBoost: 3.5,
        confidenceScore: 88,
        defaultQuantity: 1,
      });
    }
  }

  return recommendations;
}

interface BuilderLineItem {
  product: BackendProductSummary;
  quantity: number;
  discountPercent: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
}

export const QuoteBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  // 1. Fetch Real Products, Price Lists, and On-Demand Customer from Backend
  const { data: productData, isLoading: isProductsLoading } = useProducts({ isActive: true });
  const { data: priceLists, isLoading: isPriceListsLoading } = usePriceLists();

  const products = productData?.items || [];
  const defaultPriceList = priceLists?.find((pl) => pl.isDefault) || priceLists?.[0];

  // 2. Selection State (On-demand searchable customer selection)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || '');
  const [notes, setNotes] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // 3. Line Items State (Starts empty by default)
  const [lineItems, setLineItems] = useState<BuilderLineItem[]>([]);

  // 4. Live Server-Side Product Search for Catalog Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);

  const {
    data: searchProductData,
    isLoading: isSearchProductLoading,
  } = useProducts(
    {
      search: debouncedProductSearch.trim() || undefined,
      limit: 15,
      isActive: true,
    },
    { enabled: isProductModalOpen }
  );

  const modalProducts = searchProductData?.items || [];

  // Staged multi-product selections inside the modal: map of productId -> { product, quantity }
  const [stagedProducts, setStagedProducts] = useState<
    Record<string, { product: BackendProductSummary; quantity: number }>
  >({});

  const handleStageQuantityChange = (product: BackendProductSummary, delta: number) => {
    setStagedProducts((prev) => {
      const current = prev[product.id]?.quantity || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      const maxStock = product.stock !== undefined && product.stock !== null ? product.stock : Infinity;
      const capped = Math.min(next, maxStock > 0 ? maxStock : 1);
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: capped,
        },
      };
    });
  };

  const handleStageSetQuantity = (product: BackendProductSummary, qty: number) => {
    setStagedProducts((prev) => {
      if (qty <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      const maxStock = product.stock !== undefined && product.stock !== null ? product.stock : Infinity;
      const capped = Math.min(qty, maxStock > 0 ? maxStock : 1);
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: capped,
        },
      };
    });
  };

  // Cross-sell / Upsell recommendations state (computed for in-page recommendation cards)
  const availableRecommendations = useMemo(() => {
    return deriveCrossSellRecommendations(lineItems, products);
  }, [lineItems, products]);

  const handleConfirmAddProducts = () => {
    const entries = Object.values(stagedProducts);
    if (entries.length === 0) {
      setIsProductModalOpen(false);
      return;
    }

    const nextLineItems = [...lineItems];

    for (const { product, quantity } of entries) {
      const existingIdx = nextLineItems.findIndex((l) => l.product.id === product.id);
      if (existingIdx >= 0) {
        const currentItem = nextLineItems[existingIdx];
        const newQty = currentItem.quantity + quantity;
        const gross = currentItem.unitPrice * newQty;
        const discAmt = (gross * currentItem.discountPercent) / 100;
        nextLineItems[existingIdx] = {
          ...currentItem,
          quantity: newQty,
          grossAmount: gross,
          discountAmount: discAmt,
          netAmount: gross - discAmt,
        };
      } else {
        const unitPrice = parseFloat(String(product.basePrice)) || 0;
        const gross = unitPrice * quantity;
        const discAmt = 0;
        nextLineItems.push({
          product,
          quantity,
          discountPercent: 0,
          unitPrice,
          grossAmount: gross,
          discountAmount: discAmt,
          netAmount: gross - discAmt,
        });
      }
    }

    setLineItems(nextLineItems);
    setStagedProducts({});
    setProductSearch('');
    setIsProductModalOpen(false);
  };

  const handleAddSingleRecommendation = (rec: CrossSellRecommendation) => {
    setLineItems((prev) => {
      const existingIdx = prev.findIndex((l) => l.product.id === rec.product.id);
      if (existingIdx >= 0) {
        const current = prev[existingIdx];
        const newQty = current.quantity + (rec.defaultQuantity || 1);
        const gross = current.unitPrice * newQty;
        const discAmt = (gross * current.discountPercent) / 100;
        const updated = [...prev];
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          grossAmount: gross,
          discountAmount: discAmt,
          netAmount: gross - discAmt,
        };
        return updated;
      }
      const unitPrice = parseFloat(String(rec.product.basePrice)) || 0;
      const qty = rec.defaultQuantity || 1;
      const gross = unitPrice * qty;
      return [
        ...prev,
        {
          product: rec.product,
          quantity: qty,
          discountPercent: 0,
          unitPrice,
          grossAmount: gross,
          discountAmount: 0,
          netAmount: gross,
        },
      ];
    });
    toast.success(`Added ${rec.product.name} to quotation!`);
  };

  // 5. Line Item Actions
  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setLineItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const gross = item.unitPrice * newQty;
      const discAmt = (gross * item.discountPercent) / 100;
      updated[index] = {
        ...item,
        quantity: newQty,
        grossAmount: gross,
        discountAmount: discAmt,
        netAmount: gross - discAmt,
      };
      return updated;
    });
  };

  const handleDiscountChange = (index: number, newDiscount: number) => {
    const clampedDiscount = Math.min(100, Math.max(0, newDiscount));
    setLineItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const discAmt = (item.grossAmount * clampedDiscount) / 100;
      updated[index] = {
        ...item,
        discountPercent: clampedDiscount,
        discountAmount: discAmt,
        netAmount: item.grossAmount - discAmt,
      };
      return updated;
    });
  };

  const handleRemoveLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 6. Computed Totals
  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.grossAmount, 0),
    [lineItems]
  );

  const totalDiscount = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.discountAmount, 0),
    [lineItems]
  );

  const netTotal = subtotal - totalDiscount;

  const averageDiscountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

  // Max line discount to determine governance path
  const maxLineDiscount = useMemo(
    () => (lineItems.length > 0 ? Math.max(...lineItems.map((i) => i.discountPercent)) : 0),
    [lineItems]
  );

  const requiresFinanceApproval = maxLineDiscount > 20 || averageDiscountPercent > 20;
  const requiresManagerApproval = !requiresFinanceApproval && (maxLineDiscount > 10 || averageDiscountPercent > 10);

  // 7. Mutations
  const createQuoteMutation = useCreateQuotationMutation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleSaveQuotation = async (action: 'draft' | 'submit') => {
    if (!selectedCustomerId) {
      setSubmissionError('Please select a customer.');
      return;
    }

    if (!defaultPriceList?.id) {
      setSubmissionError('No active commercial price list found in system.');
      return;
    }

    if (lineItems.length === 0) {
      setSubmissionError('Please add at least one line item to the quotation.');
      return;
    }

    const stockErrorItem = lineItems.find(
      (item) => item.product.stock !== undefined && item.product.stock !== null && item.quantity > item.product.stock
    );
    if (stockErrorItem) {
      setSubmissionError(
        `Stock validation failed: Product "${stockErrorItem.product.name}" requested quantity (${stockErrorItem.quantity}) exceeds available inventory (${stockErrorItem.product.stock} in stock). Please adjust quantity.`
      );
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      // Atomic single-request quotation creation with items & optional approval submission
      const createdQuote = await createQuoteMutation.mutateAsync({
        customerId: selectedCustomerId,
        priceListId: defaultPriceList.id,
        issueDate,
        expiryDate,
        notes: notes.trim() || undefined,
        currency: 'INR',
        items: lineItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          discountPercent: item.discountPercent,
        })),
        submitForApproval: action === 'submit',
        submitNotes: action === 'submit' ? notes.trim() || 'Submitting for discount governance review' : undefined,
      });

      // Navigate to quotation detail page
      navigate(`/quotations/${createdQuote.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to save quotation. Please verify your inputs.';
      setSubmissionError(msg);
      setIsSubmitting(false);
    }
  };

  const isLoading = isProductsLoading || isPriceListsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="h-9 w-9 animate-spin text-[#3568ed] mb-3" />
        <h3 className="text-base font-bold text-[#17213a]">Loading CPQ Engine &amp; Catalogs...</h3>
        <p className="text-xs text-[#71809f] mt-1">Retrieving commercial price books and product catalogs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/quotations')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Cancel
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              New CPQ Quotation
            </h1>
            <p className="text-xs text-[#59657d] mt-0.5">
              Build and govern commercial pricing for customer accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => handleSaveQuotation('draft')}
          >
            {isSubmitting ? 'Creating quotation...' : 'Save as Draft'}
          </Button>
          <Button
            variant="primary"
            leftIcon={isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            disabled={isSubmitting || lineItems.length === 0}
            onClick={() => handleSaveQuotation('submit')}
          >
            {isSubmitting ? 'Creating quotation...' : 'Submit for Approval'}
          </Button>
        </div>
      </div>

      {/* Submission Error Banner */}
      {submissionError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{submissionError}</span>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Left Column: Customer Selection & Line Items */}
        <div className="space-y-6">
          {/* Customer Selection Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-[#3568ed]" />
                <CardTitle>Customer &amp; Account Selection</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475467] mb-1.5">
                  Select Customer Account
                </label>
                <CustomerSearchCombobox
                  selectedCustomerId={selectedCustomerId}
                  onSelectCustomer={(c) => setSelectedCustomerId(c?.id || '')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Dates & Notes */}
              <div className="grid gap-4 sm:grid-cols-2 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475467] mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475467] mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475467] mb-1">
                  Contract / Proposal Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add commercial justification or notes..."
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs text-[#17213a] placeholder:text-gray-400 focus:border-[#3568ed] focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Package className="h-4.5 w-4.5 text-[#3568ed]" />
                  <CardTitle>Quotation Line Items</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setStagedProducts({});
                    setProductSearch('');
                    setIsProductModalOpen(true);
                  }}
                >
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lineItems.some(
                (i) => i.product.stock !== undefined && i.product.stock !== null && i.quantity > i.product.stock
              ) && (
                <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-rose-900">Stock Availability Warning:</strong>
                    <p className="mt-0.5 text-rose-700">
                      One or more requested quantities exceed current available stock. Please review highlighted items before submitting.
                    </p>
                  </div>
                </div>
              )}

              {lineItems.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-600">No products added yet</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Click &ldquo;Add Product&rdquo; above to select items from your catalog.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3.5"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setStagedProducts({});
                      setProductSearch('');
                      setIsProductModalOpen(true);
                    }}
                  >
                    Add Product
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#fbfcfe] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                        <th className="py-2.5 px-4 font-semibold">Product / SKU</th>
                        <th className="py-2.5 font-semibold text-center">Available Stock</th>
                        <th className="py-2.5 font-semibold text-right">Unit Price</th>
                        <th className="py-2.5 font-semibold text-center w-28">Quantity</th>
                        <th className="py-2.5 font-semibold text-center w-24">Discount %</th>
                        <th className="py-2.5 font-semibold text-right">Net Amount</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineItems.map((item, idx) => {
                        const isStockInvalid =
                          item.product.stock !== undefined &&
                          item.product.stock !== null &&
                          item.quantity > item.product.stock;

                        return (
                        <tr
                          key={`${item.product.id}-${idx}`}
                          className={isStockInvalid ? 'bg-rose-50/50 hover:bg-rose-50/80' : 'hover:bg-gray-50/50'}
                        >
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#17213a]">{item.product.name}</p>
                            <span className="text-[10px] text-gray-400">SKU: {item.product.sku}</span>
                          </td>
                          <td className="py-3 text-center">
                            {item.product.stock === undefined || item.product.stock === null ? (
                              <span className="text-gray-400 font-medium text-[11px]">N/A</span>
                            ) : item.product.stock === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                Out of Stock (0)
                              </span>
                            ) : isStockInvalid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                ⚠️ Only {item.product.stock} in stock
                              </span>
                            ) : item.product.stock <= 10 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                {item.product.stock} available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                {item.product.stock} in stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-medium text-[#17213a]">
                            {formatINR(item.unitPrice)}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                                className="h-6 w-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                              >
                                -
                              </button>
                              <span className={`w-8 text-center font-bold ${isStockInvalid ? 'text-rose-700' : 'text-[#17213a]'}`}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                                className="h-6 w-6 rounded border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                              >
                                +
                              </button>
                            </div>
                            {isStockInvalid && (
                              <p className="text-[9px] font-bold text-rose-600 mt-0.5">
                                Max {item.product.stock}
                              </p>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discountPercent}
                                onChange={(e) =>
                                  handleDiscountChange(idx, parseFloat(e.target.value) || 0)
                                }
                                className="w-14 rounded border border-gray-200 p-1 text-center font-semibold text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                              />
                              <span className="text-gray-400 text-xs">%</span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-bold text-[#17213a]">
                            {formatINR(item.netAmount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Smart Cross-Sell & Upsell Opportunities Section */}
          {lineItems.length > 0 && availableRecommendations.length > 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/40 p-5 shadow-xs animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#17213a] flex items-center gap-2">
                      AI Cross-Sell &amp; Margin Recommendations
                      <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5">
                        {availableRecommendations.length} available
                      </span>
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      High-margin complementary add-ons and services matching your current quotation lines.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid of quick-add recommendation cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {availableRecommendations.slice(0, 4).map((rec) => (
                  <div
                    key={rec.product.id}
                    className="flex flex-col justify-between rounded-xl border border-indigo-100 bg-white p-3.5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            rec.recommendationType === 'UPSELL'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {rec.recommendationType === 'UPSELL' ? '⬆️ Upsell' : '➕ Cross-Sell'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <TrendingUp size={11} />
                          +{rec.expectedMarginBoost}% Margin
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-[#17213a] line-clamp-1">{rec.product.name}</h5>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {rec.rationale}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-100">
                      <span className="text-xs font-bold text-[#17213a]">
                        {formatINR(parseFloat(String(rec.product.basePrice)) || 0)}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAddSingleRecommendation(rec)}
                        className="text-xs py-1 px-2.5 h-7 gap-1 font-semibold"
                      >
                        <Plus size={12} />
                        Add to Quote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Commercial Summary & Governance Feedback */}
        <div className="space-y-6">
          {/* Pricing & Commercial Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Commercial Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Gross Subtotal:</span>
                <span className="font-semibold text-[#17213a]">{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Total Discount:</span>
                <span className="font-semibold text-amber-600">
                  -{formatINR(totalDiscount)} ({formatPercent(averageDiscountPercent)})
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm">
                <span className="font-bold text-[#17213a]">Net Total Amount:</span>
                <span className="text-lg font-bold text-[#3568ed]">{formatINR(netTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Discount Governance Feedback */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-[#3568ed]" />
                <CardTitle>Discount Governance Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiresFinanceApproval ? (
                <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-xs text-red-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Finance &amp; Operations Signoff Required</span>
                  </div>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    Discount exceeds 20%. Submitting will route through Sales Manager and VP of Finance approval chains.
                  </p>
                </div>
              ) : requiresManagerApproval ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Sales Manager Approval Required</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Discount is between 11%–20%. Requires Sales Director review before customer delivery.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Auto-Approval Eligible</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Discounts are within pre-approved delegation threshold (&le; 10%).
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 space-y-1 border border-gray-100">
                <div className="flex justify-between">
                  <span>Standard Rep Delegation:</span>
                  <strong className="text-gray-700">Up to 10.0%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Manager Delegation:</span>
                  <strong className="text-gray-700">10.1% – 20.0%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Finance &amp; Executive:</span>
                  <strong className="text-gray-700">&gt; 20.0%</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Selection Modal - Live Server-Side Search with Multi-Selection */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setStagedProducts({});
          setProductSearch('');
        }}
        title="Select Products from Catalog"
        description="Search items, adjust quantities using + and -, and click OK to add multiple products."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Server-Side Search Input */}
          <div className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search product / SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
              autoFocus
            />
            {isSearchProductLoading && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#3568ed] shrink-0" />
            )}
          </div>

          {/* Product Items List */}
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {isSearchProductLoading && modalProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#3568ed] mb-2" />
                Searching product catalog...
              </div>
            ) : modalProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                {productSearch ? `No products match "${productSearch}".` : 'No active products available.'}
              </div>
            ) : (
              modalProducts.map((prod) => {
                const staged = stagedProducts[prod.id];
                const stagedQty = staged ? staged.quantity : 0;
                const isSelected = stagedQty > 0;
                const price = parseFloat(String(prod.basePrice)) || 0;
                const isOutOfStock = prod.stock !== undefined && prod.stock !== null && prod.stock <= 0;
                const maxStock = prod.stock !== undefined && prod.stock !== null ? prod.stock : Infinity;
                const existingInQuote = lineItems.find((l) => l.product.id === prod.id);

                return (
                  <div
                    key={prod.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 transition ${
                      isSelected
                        ? 'border-[#3568ed] bg-blue-50/30 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-[#17213a]">{prod.name}</h4>
                        {existingInQuote && (
                          <span className="rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                            In Quote: {existingInQuote.quantity}
                          </span>
                        )}
                        {prod.stock === undefined || prod.stock === null ? null : prod.stock === 0 ? (
                          <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                            Out of stock (0)
                          </span>
                        ) : prod.stock <= 10 ? (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                            Low Stock: {prod.stock} left
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            Stock: {prod.stock}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        SKU: <span className="font-mono text-gray-600 font-semibold">{prod.sku}</span> • {prod.category?.name || 'General'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#17213a] block">
                          {formatINR(price)}
                        </span>
                        {stagedQty > 1 && (
                          <span className="text-[10px] text-gray-400 block font-medium">
                            Subtotal: {formatINR(price * stagedQty)}
                          </span>
                        )}
                      </div>

                      {isOutOfStock ? (
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1">
                          Unavailable
                        </span>
                      ) : !isSelected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStageQuantityChange(prod, 1)}
                          className="border-gray-300 text-[#17213a] hover:border-[#3568ed] hover:text-[#3568ed] hover:bg-blue-50/50"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1 text-[#3568ed]" />
                          Add
                        </Button>
                      ) : (
                        <div className="flex items-center rounded-lg border border-[#3568ed] bg-white p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleStageQuantityChange(prod, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#3568ed] hover:bg-blue-50 transition cursor-pointer font-bold"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={maxStock}
                            value={stagedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleStageSetQuantity(prod, isNaN(val) ? 1 : val);
                            }}
                            className="w-10 text-center text-xs font-bold text-[#17213a] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleStageQuantityChange(prod, 1)}
                            disabled={stagedQty >= maxStock}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[#3568ed] hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-bold"
                            title={stagedQty >= maxStock ? 'Max stock reached' : 'Increase quantity'}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer with OK Button */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 mt-2">
            <div>
              {Object.keys(stagedProducts).length > 0 ? (
                <div className="text-xs">
                  <span className="font-bold text-[#17213a]">
                    {Object.keys(stagedProducts).length} product{Object.keys(stagedProducts).length > 1 ? 's' : ''} selected
                  </span>
                  <span className="text-gray-400 mx-1.5">•</span>
                  <span className="text-gray-600 font-medium">
                    {Object.values(stagedProducts).reduce((s, i) => s + i.quantity, 0)} units
                  </span>
                  <span className="text-gray-400 mx-1.5">•</span>
                  <span className="font-bold text-[#3568ed]">
                    {formatINR(
                      Object.values(stagedProducts).reduce((sum, item) => {
                        const pr = parseFloat(String(item.product.basePrice)) || 0;
                        return sum + pr * item.quantity;
                      }, 0)
                    )}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Select items and adjust quantities above.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsProductModalOpen(false);
                  setStagedProducts({});
                  setProductSearch('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAddProducts}
                disabled={Object.keys(stagedProducts).length === 0}
                className="gap-1.5 font-bold shadow-xs cursor-pointer"
              >
                <span>
                  OK {Object.values(stagedProducts).reduce((s, i) => s + i.quantity, 0) > 0
                    ? `(${Object.values(stagedProducts).reduce((s, i) => s + i.quantity, 0)})`
                    : ''}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
