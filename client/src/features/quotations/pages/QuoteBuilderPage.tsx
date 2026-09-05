import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Package,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Percent,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { INITIAL_CUSTOMERS } from '@/features/customers/data/customerData';
import { INITIAL_PRODUCTS } from '@/features/products/data/catalogData';
import { Product } from '@/features/products/types/Product';
import { Quotation, QuotationLineItem } from '../types/Quotation';
import {
  calculateLineItem,
  evaluateFinancialsAndGovernance,
} from '../utils/quoteCalculations';
import { getRecommendationsForQuote } from '@/features/upsell-cross-sell/utils/recommender';
import { quotationStore } from '../store/quotationStore';
import { useDeals } from '@/features/deals/store/dealStore';
import { formatINR, formatPercent } from '@/utils/formatters';

export const QuoteBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { deals } = useDeals();

  const preselectedDealId = searchParams.get('dealId');
  const preselectedCustomerId = searchParams.get('customerId');

  // Customer Selection State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || 'CUST-001'
  );
  const selectedCustomer = useMemo(
    () => INITIAL_CUSTOMERS.find((c) => c.id === selectedCustomerId) || INITIAL_CUSTOMERS[0],
    [selectedCustomerId]
  );

  const [paymentTerms, setPaymentTerms] = useState<'Net 30' | 'Net 45' | 'Net 60'>(
    selectedCustomer.paymentTerms
  );

  // Line items state
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    calculateLineItem(INITIAL_PRODUCTS[0], 2, 10), // Default with 2 Server Blades @ 10%
  ]);

  // Product Picker Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Computed Financials & Governance
  const financialsAndGovernance = useMemo(
    () => evaluateFinancialsAndGovernance(lineItems, selectedCustomer.tier, paymentTerms),
    [lineItems, selectedCustomer.tier, paymentTerms]
  );

  // Contextual Upsell Recommendations
  const upsellRecommendations = useMemo(
    () => getRecommendationsForQuote(lineItems),
    [lineItems]
  );

  // Line item handlers
  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const item = lineItems[index];
    const product = INITIAL_PRODUCTS.find((p) => p.id === item.productId);
    if (!product) return;

    const updated = [...lineItems];
    updated[index] = calculateLineItem(product, newQty, item.discountPercent);
    setLineItems(updated);
  };

  const handleDiscountChange = (index: number, newDiscount: number) => {
    const item = lineItems[index];
    const product = INITIAL_PRODUCTS.find((p) => p.id === item.productId);
    if (!product) return;

    const updated = [...lineItems];
    updated[index] = calculateLineItem(product, item.quantity, newDiscount);
    setLineItems(updated);
  };

  const handleRemoveLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleAddProductToQuote = (product: Product, quantity = 1, discount = 0) => {
    // Check if already in line items
    const existingIndex = lineItems.findIndex((i) => i.productId === product.id);
    if (existingIndex >= 0) {
      handleQuantityChange(existingIndex, lineItems[existingIndex].quantity + quantity);
    } else {
      const newLine = calculateLineItem(product, quantity, discount);
      setLineItems([...lineItems, newLine]);
    }
    setIsProductModalOpen(false);
  };

  // Submit Handler
  const handleSubmit = (action: 'submit' | 'draft') => {
    const quoteId = `Q-${Math.floor(1000 + Math.random() * 9000)}`;

    const newQuote: Quotation = {
      id: quoteId,
      dealId: preselectedDealId || undefined,
      dealTitle: preselectedDealId
        ? deals.find((d) => d.id === preselectedDealId)?.title
        : `${selectedCustomer.name} CPQ Package`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerTier: selectedCustomer.tier,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      salesRepName: 'Riya Patel',
      paymentTerms,
      status: action === 'draft' ? 'draft' : 'pending_approval',
      lineItems,
      ...financialsAndGovernance,
      fulfillmentStatus: 'allocation_pending',
      warehouses: [
        {
          warehouseId: 'WH-MUM',
          warehouseName: 'Mumbai Central Logistics Hub',
          city: 'Mumbai',
          itemsCount: Math.ceil(lineItems.reduce((acc, i) => acc + i.quantity, 0) * 0.6),
          status: 'reserved',
        },
        {
          warehouseId: 'WH-BLR',
          warehouseName: 'Bengaluru Tech Logistics Depot',
          city: 'Bengaluru',
          itemsCount: Math.floor(lineItems.reduce((acc, i) => acc + i.quantity, 0) * 0.4),
          status: 'reserved',
        },
      ],
      billingMilestones: [
        {
          id: 'M-1',
          title: 'Contract Signing Advance (50%)',
          percentage: 50,
          amount: Math.round(financialsAndGovernance.netTotal * 0.5),
          status: 'pending',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          id: 'M-2',
          title: 'Delivery & Commissioning Signoff (50%)',
          percentage: 50,
          amount: Math.round(financialsAndGovernance.netTotal * 0.5),
          status: 'pending',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ],
      negotiationEntries: [],
    };

    quotationStore.createOrUpdateQuotation(newQuote);

    if (action === 'submit') {
      quotationStore.submitForApproval(quoteId);
    }

    navigate(`/quotations/${quoteId}`);
  };

  const filteredCatalog = INITIAL_PRODUCTS.filter((p) => {
    if (selectedCategoryFilter === 'all') return true;
    return p.category === selectedCategoryFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Configure Price & Quote (CPQ) Builder
            </h1>
            <p className="mt-0.5 text-xs text-[#71809f]">
              Build governed quotes with real-time margin modeling, category discount ceilings, and cross-sell guidance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit('submit')}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            {financialsAndGovernance.governanceLevel === 'auto_approved'
              ? 'Finalize & Auto-Approve'
              : 'Submit for Governance Approval'}
          </Button>
        </div>
      </div>

      {/* Customer & Account Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#3568ed]" />
            <CardTitle>Customer Account & Governance Tier</CardTitle>
          </div>
          <Badge
            variant={
              selectedCustomer.tier === 'Gold'
                ? 'gold'
                : selectedCustomer.tier === 'Silver'
                ? 'silver'
                : 'bronze'
            }
          >
            {selectedCustomer.tier} Tier Account
          </Badge>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Customer Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#475467] mb-1.5">
                Select Customer Account
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs font-semibold text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              >
                {INITIAL_CUSTOMERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tier} Tier)
                  </option>
                ))}
              </select>
            </div>

            {/* Procurement Contact */}
            <div>
              <span className="block text-xs font-semibold text-[#475467] mb-1">
                Procurement Contact
              </span>
              <p className="text-xs font-bold text-[#17213a] mt-2">
                {selectedCustomer.contactPerson}
              </p>
              <p className="text-[11px] text-[#71809f]">{selectedCustomer.email}</p>
            </div>

            {/* Standard Discount Allowance */}
            <div>
              <span className="block text-xs font-semibold text-[#475467] mb-1">
                Tier Discount Policy
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-bold text-emerald-600">
                  Up to {selectedCustomer.discountAllowancePercent}%
                </span>
                <span className="text-[11px] text-[#71809f]">without escalation</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Credit Line: {formatINR(selectedCustomer.creditLimit)}</p>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-semibold text-[#475467] mb-1.5">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value as 'Net 30' | 'Net 45' | 'Net 60')}
                className="w-full rounded-xl border border-[#d0d5dd] bg-white p-2.5 text-xs font-semibold text-[#17213a] focus:border-[#3568ed] focus:outline-none"
              >
                <option value="Net 30">Net 30 Days (Standard)</option>
                <option value="Net 45">Net 45 Days (Silver/Gold)</option>
                <option value="Net 60">Net 60 Days (Gold Only / Finance Signoff)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Products Table & Live Financial Summary */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          {/* Line Items Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Quote Line Items</CardTitle>
                <p className="mt-0.5 text-xs text-[#71809f]">
                  Combine one-time hardware, recurring subscriptions, and engineering services.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsProductModalOpen(true)}
              >
                Add Product / Service
              </Button>
            </CardHeader>

            <CardContent>
              {lineItems.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  <Package className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-gray-700">No products added yet</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Click &ldquo;Add Product / Service&rdquo; to browse the catalog.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() => setIsProductModalOpen(true)}
                  >
                    Browse Catalog
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        item.isDiscountExceeded
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-[#e7ebf7] bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#17213a]">{item.name}</span>
                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 uppercase">
                              {item.billingType === 'recurring' ? `${item.billingPeriod} SaaS` : 'One-Time'}
                            </span>
                            <span className="text-[11px] text-gray-400">SKU: {item.sku}</span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#59657d]">
                            <span>List Price: <strong>{formatINR(item.unitPrice)}</strong></span>
                            <span>Cost: <strong>{formatINR(item.costPrice)}</strong></span>
                            <span className="text-emerald-700 font-semibold">
                              Margin: {formatPercent(item.lineMarginPercent)}
                            </span>
                          </div>

                          {/* Discount Ceiling Alert on Line Item */}
                          {item.isDiscountExceeded && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-2.5 py-1 text-[11px] font-semibold text-amber-900 border border-amber-300">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span>
                                Exceeds {item.category.replace('_', ' ')} ceiling ({item.discountCeiling}%). Triggers manager approval.
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Controls: Quantity & Discount Input */}
                        <div className="flex items-center gap-3">
                          {/* Quantity */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                              className="w-16 rounded-lg border border-gray-300 p-1.5 text-center text-xs font-bold text-[#17213a] focus:border-[#3568ed] focus:outline-none"
                            />
                          </div>

                          {/* Discount % */}
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Discount %
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discountPercent}
                                onChange={(e) => handleDiscountChange(idx, parseFloat(e.target.value) || 0)}
                                className={`w-20 rounded-lg border p-1.5 pr-6 text-center text-xs font-bold focus:outline-none ${
                                  item.isDiscountExceeded
                                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                                    : 'border-gray-300 text-[#17213a] focus:border-[#3568ed]'
                                }`}
                              />
                              <Percent className="h-3 w-3 text-gray-400 absolute right-2 top-2.5" />
                            </div>
                          </div>

                          {/* Line Total */}
                          <div className="text-right min-w-[100px]">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                              Line Total
                            </span>
                            <span className="text-sm font-bold text-[#17213a] block">
                              {formatINR(item.lineTotal)}
                            </span>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="mt-4 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upsell / Cross-Sell Recommendation Engine */}
          {upsellRecommendations.length > 0 && (
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">
                    Intelligent Upsell & Cross-Sell Recommendations
                  </h3>
                  <p className="text-xs text-indigo-700">
                    High-margin attachments matching this customer profile and line items
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {upsellRecommendations.map((rec) => (
                  <div
                    key={rec.product.id}
                    className="flex flex-col justify-between rounded-xl border border-indigo-100 bg-white p-3.5 shadow-2xs hover:border-indigo-300 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#17213a]">
                          {rec.product.name}
                        </span>
                        <Badge variant="success" size="sm">
                          +{rec.expectedMarginBoost}% Margin
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#59657d] leading-relaxed">
                        {rec.rationale}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-indigo-50 pt-2.5">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase">Price</span>
                        <span className="text-xs font-bold text-[#17213a]">
                          {formatINR(rec.product.basePrice)}
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Plus className="h-3 w-3" />}
                        onClick={() => handleAddProductToQuote(rec.product, 1, 0)}
                      >
                        Add to Quote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Financial Summary & Risk Governance Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Financial Summary</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Gross List Total</span>
                  <span className="font-semibold text-gray-800">{formatINR(financialsAndGovernance.grossTotal)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Total Discounts Applied</span>
                  <span className="font-semibold text-red-600">
                    - {formatINR(financialsAndGovernance.totalDiscountAmount)} ({formatPercent(financialsAndGovernance.averageDiscountPercent)})
                  </span>
                </div>

                {financialsAndGovernance.recurringARRSubtotal > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-100 bg-blue-50/50 p-2 rounded-lg">
                    <span className="text-blue-800 font-medium">Annual Recurring (ARR)</span>
                    <span className="font-bold text-blue-800">{formatINR(financialsAndGovernance.recurringARRSubtotal)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b-2 border-gray-200">
                  <span className="text-sm font-bold text-[#17213a]">Net Total Value</span>
                  <span className="text-base font-bold text-[#3568ed]">
                    {formatINR(financialsAndGovernance.netTotal)}
                  </span>
                </div>

                {/* Margin Health Bar */}
                <div className="rounded-xl bg-[#f8faff] border border-[#eef2fc] p-3.5 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#17213a]">Gross Profit Margin</span>
                    <span
                      className={`text-sm font-bold ${
                        financialsAndGovernance.grossMarginPercent >= 30
                          ? 'text-emerald-600'
                          : financialsAndGovernance.grossMarginPercent >= 20
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatPercent(financialsAndGovernance.grossMarginPercent)}
                    </span>
                  </div>

                  <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        financialsAndGovernance.grossMarginPercent >= 30
                          ? 'bg-emerald-500'
                          : financialsAndGovernance.grossMarginPercent >= 20
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, financialsAndGovernance.grossMarginPercent))}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                    <span>COGS: {formatINR(financialsAndGovernance.totalCost)}</span>
                    <span>Gross Profit: {formatINR(financialsAndGovernance.grossProfit)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discount Governance & Risk Assessment Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#3568ed]" />
                <CardTitle>Governance & Approvals</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              {financialsAndGovernance.governanceLevel === 'auto_approved' ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Auto-Approved within Rep Authority</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700">
                    All discounts are within category ceilings and customer tier policy. Margin is healthy (&gt; 30%).
                  </p>
                </div>
              ) : financialsAndGovernance.governanceLevel === 'requires_manager' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Requires Sales Manager Approval</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-700">
                    Assigned Approver: <strong>Vikram Mehta (Sales Director)</strong>
                  </p>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-amber-800">
                    {financialsAndGovernance.governanceReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Requires Manager + Finance Approval</span>
                  </div>
                  <p className="mt-1 text-[11px] text-red-700">
                    High discount or sub-20% margin triggers dual escalation to <strong>Vikram Mehta</strong> and <strong>Ananya Iyer (Finance)</strong>.
                  </p>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-red-800">
                    {financialsAndGovernance.governanceReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Multi-Warehouse Readiness Insight */}
              <div className="mt-4 border-t border-gray-100 pt-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#17213a] mb-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span>Fulfillment Allocation Preview</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-gray-600">
                  <div className="flex justify-between">
                    <span>Mumbai Central Logistics</span>
                    <span className="font-semibold text-emerald-600">In Stock</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bengaluru Tech Logistics</span>
                    <span className="font-semibold text-emerald-600">In Stock</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delhi Fulfillment Depot</span>
                    <span className="font-semibold text-emerald-600">In Stock</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Catalog Product Selection Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Add Product or Subscription to Quote"
        description="Select from hardware, SaaS subscriptions, or professional engineering packages"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
            {[
              { id: 'all', label: 'All Catalog Items' },
              { id: 'hardware', label: 'Hardware Equipment' },
              { id: 'software', label: 'Software & Platform' },
              { id: 'cloud_subscription', label: 'Cloud & AI' },
              { id: 'professional_services', label: 'Engineering Services' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-[#3568ed] text-white font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Items List */}
          <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {filteredCatalog.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-3.5 hover:border-[#3568ed] hover:bg-[#f8faff] transition"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#17213a]">{prod.name}</span>
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 uppercase">
                      {prod.billingType}
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                      Max Disc: {prod.discountCeilingPercent}%
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">{prod.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#17213a] block">
                      {formatINR(prod.basePrice)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Cost: {formatINR(prod.costPrice)}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddProductToQuote(prod, 1, 0)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
