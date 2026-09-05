import { useState, useEffect } from 'react';
import { Quotation, QuotationLineItem } from '../types/Quotation';
import { INITIAL_PRODUCTS } from '@/features/products/data/catalogData';
import { calculateLineItem, evaluateFinancialsAndGovernance } from '../utils/quoteCalculations';
import { dealStore } from '@/features/deals/store/dealStore';

const STORAGE_KEY = 'dealflow360_quotations_store_v1';

// Pre-build initial realistic quotes
function buildSeedQuotes(): Quotation[] {
  // Quote Q-1024 (TCS)
  const q1024Items: QuotationLineItem[] = [
    calculateLineItem(INITIAL_PRODUCTS[0], 4, 15), // 4 Server Blades @ 15%
    calculateLineItem(INITIAL_PRODUCTS[6], 1, 10), // 24/7 SLA @ 10%
  ];
  const q1024Fin = evaluateFinancialsAndGovernance(q1024Items, 'Gold', 'Net 60');

  const q1024: Quotation = {
    id: 'Q-1024',
    dealId: 'DEAL-101',
    dealTitle: 'Hybrid Cloud & Edge Expansion',
    customerId: 'CUST-001',
    customerName: 'Tata Consultancy Services',
    customerTier: 'Gold',
    createdAt: '2026-09-02T10:30:00Z',
    validUntil: '2026-10-02T23:59:59Z',
    salesRepName: 'Riya Patel',
    paymentTerms: 'Net 60',
    status: 'pending_approval',
    lineItems: q1024Items,
    ...q1024Fin,
    fulfillmentStatus: 'allocation_pending',
    warehouses: [
      { warehouseId: 'WH-MUM', warehouseName: 'Mumbai Central Logistics Hub', city: 'Mumbai', itemsCount: 3, status: 'reserved' },
      { warehouseId: 'WH-BLR', warehouseName: 'Bengaluru Tech Logistics Depot', city: 'Bengaluru', itemsCount: 1, status: 'reserved' },
    ],
    billingMilestones: [
      { id: 'M-1', title: 'Advance Payment upon Contract Signing (50%)', percentage: 50, amount: Math.round(q1024Fin.netTotal * 0.5), status: 'pending', dueDate: '2026-09-15' },
      { id: 'M-2', title: 'Hardware Delivery & Site Acceptance (50%)', percentage: 50, amount: Math.round(q1024Fin.netTotal * 0.5), status: 'pending', dueDate: '2026-10-15' },
    ],
    negotiationEntries: [],
  };

  // Quote Q-1023 (Infosys) - In Negotiation with Counter-Offer
  const q1023Items: QuotationLineItem[] = [
    calculateLineItem(INITIAL_PRODUCTS[3], 2, 20), // Enterprise Software @ 20%
    calculateLineItem(INITIAL_PRODUCTS[4], 12, 15), // AI Anomaly Engine @ 15%
  ];
  const q1023Fin = evaluateFinancialsAndGovernance(q1023Items, 'Gold', 'Net 60');

  const q1023: Quotation = {
    id: 'Q-1023',
    dealId: 'DEAL-102',
    dealTitle: 'Core Banking Modernization & CPQ Rollout',
    customerId: 'CUST-002',
    customerName: 'Infosys FinTech Solutions',
    customerTier: 'Gold',
    createdAt: '2026-08-28T14:15:00Z',
    validUntil: '2026-09-28T23:59:59Z',
    salesRepName: 'Riya Patel',
    paymentTerms: 'Net 60',
    status: 'in_negotiation',
    lineItems: q1023Items,
    ...q1023Fin,
    approvalChain: [
      { role: 'Sales Manager', approver: 'Vikram Mehta', status: 'approved', timestamp: '2026-08-29T11:00:00Z', comments: 'Initial quote approved within Gold limits.' },
    ],
    fulfillmentStatus: 'stock_allocated',
    warehouses: [
      { warehouseId: 'WH-CLOUD', warehouseName: 'Global Cloud Provisioning API', city: 'Cloud', itemsCount: 2, status: 'ready_for_dispatch' },
    ],
    billingMilestones: [
      { id: 'M-1', title: 'Annual Platform Activation Billing (100%)', percentage: 100, amount: q1023Fin.netTotal, status: 'pending', dueDate: '2026-09-30' },
    ],
    negotiationEntries: [
      {
        id: 'NEG-1',
        date: '2026-09-04T09:30:00Z',
        requestedDiscountPercent: 23,
        notes: 'Client requests 23% discount (additional 4%) citing enterprise multi-year commitment.',
        requiresReapproval: true,
        status: 'proposed',
      },
    ],
  };

  // Quote Q-1022 (Bharat Logistics) - Approved
  const q1022Items: QuotationLineItem[] = [
    calculateLineItem(INITIAL_PRODUCTS[1], 4, 12), // Core Switch
    calculateLineItem(INITIAL_PRODUCTS[2], 8, 10), // Smart IoT Gateway
  ];
  const q1022Fin = evaluateFinancialsAndGovernance(q1022Items, 'Silver', 'Net 45');

  const q1022: Quotation = {
    id: 'Q-1022',
    dealId: 'DEAL-104',
    dealTitle: 'Cold Chain IoT & Fleet Logistics',
    customerId: 'CUST-004',
    customerName: 'Bharat Logistics & Cold Chain',
    customerTier: 'Silver',
    createdAt: '2026-08-25T11:00:00Z',
    validUntil: '2026-09-25T23:59:59Z',
    salesRepName: 'Riya Patel',
    paymentTerms: 'Net 45',
    status: 'approved',
    lineItems: q1022Items,
    ...q1022Fin,
    approvalChain: [
      { role: 'Sales Manager', approver: 'Vikram Mehta', status: 'approved', timestamp: '2026-08-26T15:20:00Z', comments: 'Approved. Margins healthy at 38%.' },
    ],
    fulfillmentStatus: 'ready_to_dispatch',
    warehouses: [
      { warehouseId: 'WH-MUM', warehouseName: 'Mumbai Central Logistics Hub', city: 'Mumbai', itemsCount: 8, status: 'ready_for_dispatch' },
      { warehouseId: 'WH-BLR', warehouseName: 'Bengaluru Tech Logistics Depot', city: 'Bengaluru', itemsCount: 4, status: 'ready_for_dispatch' },
    ],
    billingMilestones: [
      { id: 'M-1', title: '50% Signing Advance', percentage: 50, amount: Math.round(q1022Fin.netTotal * 0.5), status: 'invoiced', dueDate: '2026-09-10' },
      { id: 'M-2', title: '50% Upon Delivery Signoff', percentage: 50, amount: Math.round(q1022Fin.netTotal * 0.5), status: 'pending', dueDate: '2026-10-10' },
    ],
    negotiationEntries: [],
  };

  // Quote Q-1021 (Apex Retailers) - Closed Won
  const q1021Items: QuotationLineItem[] = [
    calculateLineItem(INITIAL_PRODUCTS[2], 3, 5), // IoT Gateway
    calculateLineItem(INITIAL_PRODUCTS[5], 1, 0), // Deployment Service
  ];
  const q1021Fin = evaluateFinancialsAndGovernance(q1021Items, 'Bronze', 'Net 30');

  const q1021: Quotation = {
    id: 'Q-1021',
    dealId: 'DEAL-105',
    dealTitle: 'Point-of-Sale Hardware Bundle',
    customerId: 'CUST-005',
    customerName: 'Apex Retailers & D2C Brands',
    customerTier: 'Bronze',
    createdAt: '2026-08-20T09:00:00Z',
    validUntil: '2026-09-20T23:59:59Z',
    salesRepName: 'Riya Patel',
    paymentTerms: 'Net 30',
    status: 'closed_won',
    lineItems: q1021Items,
    ...q1021Fin,
    approvalChain: [
      { role: 'Sales Manager', approver: 'Auto-Rule Engine', status: 'approved', timestamp: '2026-08-20T09:01:00Z', comments: 'Auto-approved within Bronze limits.' },
    ],
    fulfillmentStatus: 'dispatched',
    warehouses: [
      { warehouseId: 'WH-BLR', warehouseName: 'Bengaluru Tech Logistics Depot', city: 'Bengaluru', itemsCount: 3, status: 'dispatched' },
    ],
    billingMilestones: [
      { id: 'M-1', title: '100% Invoice on Dispatch', percentage: 100, amount: q1021Fin.netTotal, status: 'paid', dueDate: '2026-08-30' },
    ],
    negotiationEntries: [],
  };

  return [q1024, q1023, q1022, q1021];
}

let memoryQuotes: Quotation[] = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : buildSeedQuotes();
  } catch {
    return buildSeedQuotes();
  }
})();

const listeners = new Set<() => void>();

function notify() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryQuotes));
  } catch {
    // quota limit
  }
  listeners.forEach((l) => l());
}

export const quotationStore = {
  getQuotations(): Quotation[] {
    return [...memoryQuotes];
  },
  getQuotation(id: string): Quotation | undefined {
    return memoryQuotes.find((q) => q.id === id);
  },
  createOrUpdateQuotation(quote: Quotation) {
    const idx = memoryQuotes.findIndex((q) => q.id === quote.id);
    if (idx >= 0) {
      memoryQuotes[idx] = quote;
    } else {
      memoryQuotes = [quote, ...memoryQuotes];
    }
    notify();

    // Also update linked deal if present
    if (quote.dealId) {
      dealStore.linkQuote(quote.dealId, quote.id, quote.netTotal);
    }
  },
  submitForApproval(quoteId: string) {
    const quote = memoryQuotes.find((q) => q.id === quoteId);
    if (!quote) return;

    if (quote.governanceLevel === 'auto_approved') {
      quote.status = 'approved';
      quote.approvalChain = [
        {
          role: 'Sales Manager',
          approver: 'System Auto-Approval Engine',
          status: 'approved',
          timestamp: new Date().toISOString(),
          comments: 'Auto-approved: Deal is within delegated rep authority and margin thresholds.',
        },
      ];
    } else {
      quote.status = 'pending_approval';
      quote.approvalChain = quote.approvalChain.map((step) => ({
        ...step,
        status: 'pending',
      }));
    }

    if (quote.dealId) {
      dealStore.updateDealStage(quote.dealId, 'proposal');
    }

    notify();
  },
  simulateApproval(quoteId: string, role: 'Sales Manager' | 'Finance & Ops') {
    const quote = memoryQuotes.find((q) => q.id === quoteId);
    if (!quote) return;

    const step = quote.approvalChain.find((s) => s.role === role);
    if (step) {
      step.status = 'approved';
      step.timestamp = new Date().toISOString();
      step.comments = `Approved in simulation demo mode by ${role}.`;
    }

    // If all steps approved, mark quote as approved
    const allApproved = quote.approvalChain.every((s) => s.status === 'approved');
    if (allApproved) {
      quote.status = 'approved';
      quote.fulfillmentStatus = 'stock_allocated';
      if (quote.dealId) {
        dealStore.updateDealStage(quote.dealId, 'negotiation');
      }
    }

    notify();
  },
  recordNegotiationCounterOffer(
    quoteId: string,
    requestedDiscountPercent: number,
    notes: string
  ) {
    const quote = memoryQuotes.find((q) => q.id === quoteId);
    if (!quote) return;

    // Check if extra discount breaches limits
    const requiresReapproval = requestedDiscountPercent > quote.averageDiscountPercent;

    const newEntry = {
      id: `NEG-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      requestedDiscountPercent,
      notes,
      requiresReapproval,
      status: 'proposed' as const,
    };

    quote.negotiationEntries = [newEntry, ...quote.negotiationEntries];
    quote.status = 'in_negotiation';

    if (requiresReapproval) {
      quote.status = 'under_reapproval';
      // Reset approval steps
      quote.approvalChain = [
        {
          role: 'Sales Manager',
          approver: 'Vikram Mehta',
          status: 'pending',
          comments: `Re-approval requested due to counter-offer discount: ${requestedDiscountPercent}%.`,
        },
        ...(requestedDiscountPercent > 20
          ? [
              {
                role: 'Finance & Ops' as const,
                approver: 'Ananya Iyer',
                status: 'pending' as const,
                comments: 'Finance re-approval required for high counter-offer discount.',
              },
            ]
          : []),
      ];
    }

    notify();
  },
  markClosedWon(quoteId: string) {
    const quote = memoryQuotes.find((q) => q.id === quoteId);
    if (!quote) return;

    quote.status = 'closed_won';
    quote.fulfillmentStatus = 'ready_to_dispatch';
    if (quote.billingMilestones.length > 0) {
      quote.billingMilestones[0].status = 'invoiced';
    }

    if (quote.dealId) {
      dealStore.updateDealStage(quote.dealId, 'closed_won');
    }

    notify();
  },
  reset() {
    memoryQuotes = buildSeedQuotes();
    notify();
  },
};

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>(() => quotationStore.getQuotations());

  useEffect(() => {
    const handler = () => setQuotations(quotationStore.getQuotations());
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    quotations,
    getQuotation: quotationStore.getQuotation,
    createOrUpdateQuotation: quotationStore.createOrUpdateQuotation,
    submitForApproval: quotationStore.submitForApproval,
    simulateApproval: quotationStore.simulateApproval,
    recordNegotiationCounterOffer: quotationStore.recordNegotiationCounterOffer,
    markClosedWon: quotationStore.markClosedWon,
    resetQuotations: quotationStore.reset,
  };
}
