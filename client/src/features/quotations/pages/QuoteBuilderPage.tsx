import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useCustomers } from '@/features/customers/hooks/useCustomers';
import { useProducts, usePriceLists } from '@/features/products/hooks/useProducts';
import { useCreateQuotationMutation } from '../hooks/useQuotationsQuery';
import { BackendProductSummary } from '../types/quotationApi.types';
import { formatINR, formatPercent } from '@/utils/formatters';
import { apiClient, getAccessToken } from '@/api/apiClient';

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

  // 1. Fetch Real Customers, Products, and Price Lists from Backend
  const { data: customerData, isLoading: isCustomersLoading } = useCustomers({ status: 'ACTIVE' });
  const { data: productData, isLoading: isProductsLoading } = useProducts({ isActive: true });
  const { data: priceLists, isLoading: isPriceListsLoading } = usePriceLists();

  const customers = customerData?.items || [];
  const products = productData?.items || [];
  const defaultPriceList = priceLists?.find((pl) => pl.isDefault) || priceLists?.[0];

  // 2. Selection State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Initialize selected customer once customers load
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomerId) {
      if (preselectedCustomerId && customers.some((c) => c.id === preselectedCustomerId)) {
        setSelectedCustomerId(preselectedCustomerId);
      } else {
        setSelectedCustomerId(customers[0].id);
      }
    }
  }, [customers, preselectedCustomerId, selectedCustomerId]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // 3. Line Items State
  const [lineItems, setLineItems] = useState<BuilderLineItem[]>([]);

  // Automatically add first product once loaded if lines empty
  useEffect(() => {
    if (products.length > 0 && lineItems.length === 0) {
      const p = products[0];
      const unitPrice = parseFloat(String(p.basePrice)) || 0;
      const qty = 1;
      const disc = 5;
      const gross = unitPrice * qty;
      const discAmt = (gross * disc) / 100;
      setLineItems([
        {
          product: p,
          quantity: qty,
          discountPercent: disc,
          unitPrice,
          grossAmount: gross,
          discountAmount: discAmt,
          netAmount: gross - discAmt,
        },
      ]);
    }
  }, [products, lineItems.length]);

  // 4. Product Modal & Filtering
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCat =
        selectedCategory === 'all' || p.category?.name === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, selectedCategory]);

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

  const handleAddProduct = (product: BackendProductSummary) => {
    const existingIndex = lineItems.findIndex((l) => l.product.id === product.id);
    if (existingIndex >= 0) {
      handleQuantityChange(existingIndex, lineItems[existingIndex].quantity + 1);
    } else {
      const unitPrice = parseFloat(String(product.basePrice)) || 0;
      const gross = unitPrice * 1;
      const discAmt = 0;
      setLineItems((prev) => [
        ...prev,
        {
          product,
          quantity: 1,
          discountPercent: 0,
          unitPrice,
          grossAmount: gross,
          discountAmount: discAmt,
          netAmount: gross - discAmt,
        },
      ]);
    }
    setIsProductModalOpen(false);
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
    if (!defaultPriceList?.id) {
      setSubmissionError('No active commercial price list found in system.');
      return;
    }

    if (lineItems.length === 0) {
      setSubmissionError('Please add at least one line item to the quotation.');
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

  const isLoading = isCustomersLoading || isProductsLoading || isPriceListsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="h-9 w-9 animate-spin text-[#3568ed] mb-3" />
        <h3 className="text-base font-bold text-[#17213a]">Loading CPQ Engine &amp; Catalogs...</h3>
        <p className="text-xs text-[#71809f] mt-1">Retrieving real customer accounts, price books, and products.</p>
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
              {customers.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  No active customer accounts found. Please verify backend customer seeding.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#475467] mb-1.5">
                      Select Customer
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName} {c.customerTier ? `(${c.customerTier.name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCustomer && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#17213a]">{selectedCustomer.companyName}</span>
                        {selectedCustomer.customerTier && (
                          <Badge variant="gold" size="sm">
                            {selectedCustomer.customerTier.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-[11px] truncate">
                        Contact: {selectedCustomer.contactName || selectedCustomer.email}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        ID: {selectedCustomer.id}
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                  onClick={() => setIsProductModalOpen(true)}
                >
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lineItems.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-600">No products added yet</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Click &ldquo;Add Product&rdquo; above to select items from your catalog.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#fbfcfe] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                        <th className="py-2.5 px-4 font-semibold">Product / SKU</th>
                        <th className="py-2.5 font-semibold text-right">Unit Price</th>
                        <th className="py-2.5 font-semibold text-center w-28">Quantity</th>
                        <th className="py-2.5 font-semibold text-center w-24">Discount %</th>
                        <th className="py-2.5 font-semibold text-right">Net Amount</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineItems.map((item, idx) => (
                        <tr key={`${item.product.id}-${idx}`} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#17213a]">{item.product.name}</p>
                            <span className="text-[10px] text-gray-400">SKU: {item.product.sku}</span>
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
                              <span className="w-8 text-center font-bold text-[#17213a]">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* Product Selection Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Select Product from Catalog"
        description="Choose real items from your product master to add to this quotation."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Search & Categories */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex h-9 w-full max-w-xs items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white transition">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  selectedCategory === 'all'
                    ? 'bg-[#3568ed] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-[#3568ed] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items List */}
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No products match the selected criteria.
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-3 hover:border-blue-300 hover:bg-blue-50/20 transition"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#17213a]">{prod.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      SKU: {prod.sku} • {prod.category?.name || 'General'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#17213a]">
                      {formatINR(parseFloat(String(prod.basePrice)) || 0)}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddProduct(prod)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
