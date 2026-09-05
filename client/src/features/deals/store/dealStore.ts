import { useState, useEffect } from 'react';
import { Deal } from '../types/Deal';

const STORAGE_KEY = 'dealflow360_deals_store_v1';

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'DEAL-101',
    title: 'Hybrid Cloud & Edge Expansion',
    customerId: 'CUST-001',
    customerName: 'Tata Consultancy Services',
    customerTier: 'Gold',
    stage: 'proposal',
    amount: 2450000,
    winProbability: 80,
    health: 'healthy',
    healthReason: 'Active stakeholder engagement, high budget alignment',
    expectedCloseDate: '2026-09-30',
    quoteId: 'Q-1024',
    lastActivityDays: 2,
    salesRepName: 'Riya Patel',
    notes: 'Requested hardware server blades and 24/7 SLA. Ready for proposal review.',
  },
  {
    id: 'DEAL-102',
    title: 'Core Banking Modernization & CPQ Rollout',
    customerId: 'CUST-002',
    customerName: 'Infosys FinTech Solutions',
    customerTier: 'Gold',
    stage: 'negotiation',
    amount: 1805000,
    winProbability: 70,
    health: 'discount_anomaly',
    healthReason: 'Client requested 22% discount exceeding 20% Gold ceiling',
    expectedCloseDate: '2026-09-25',
    quoteId: 'Q-1023',
    lastActivityDays: 3,
    salesRepName: 'Riya Patel',
    notes: 'Counter-offer received. Requires finance re-approval before closing.',
  },
  {
    id: 'DEAL-103',
    title: 'Edge Streaming Gateway Fleet Pilot',
    customerId: 'CUST-003',
    customerName: 'Zenith Media & Communications',
    customerTier: 'Silver',
    stage: 'discovery',
    amount: 640000,
    winProbability: 45,
    health: 'stalled',
    healthReason: 'Inactivity for 9 days following initial technical spec call',
    expectedCloseDate: '2026-10-15',
    lastActivityDays: 9,
    salesRepName: 'Riya Patel',
    notes: 'Followed up via email. Procurement waiting for Q3 capex signoff.',
  },
  {
    id: 'DEAL-104',
    title: 'Cold Chain IoT & Fleet Logistics',
    customerId: 'CUST-004',
    customerName: 'Bharat Logistics & Cold Chain',
    customerTier: 'Silver',
    stage: 'proposal',
    amount: 1280000,
    winProbability: 65,
    health: 'delivery_risk',
    healthReason: 'Requested delivery in 10 days; Bengaluru stock low',
    expectedCloseDate: '2026-10-05',
    quoteId: 'Q-1022',
    lastActivityDays: 4,
    salesRepName: 'Riya Patel',
    notes: 'Multi-warehouse split from Mumbai and Bengaluru required to meet SLA.',
  },
  {
    id: 'DEAL-105',
    title: 'Point-of-Sale Hardware Bundle',
    customerId: 'CUST-005',
    customerName: 'Apex Retailers & D2C Brands',
    customerTier: 'Bronze',
    stage: 'closed_won',
    amount: 310000,
    winProbability: 100,
    health: 'healthy',
    healthReason: 'Deal confirmed and payment milestone 1 received',
    expectedCloseDate: '2026-09-02',
    quoteId: 'Q-1021',
    lastActivityDays: 1,
    salesRepName: 'Riya Patel',
    notes: 'PO issued. Sent to warehouse for dispatch.',
  },
];

let memoryDeals: Deal[] = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DEALS;
  } catch {
    return INITIAL_DEALS;
  }
})();

const listeners = new Set<() => void>();

function notify() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryDeals));
  } catch {
    // Ignore storage quota
  }
  listeners.forEach((l) => l());
}

export const dealStore = {
  getDeals(): Deal[] {
    return [...memoryDeals];
  },
  getDeal(id: string): Deal | undefined {
    return memoryDeals.find((d) => d.id === id);
  },
  getDealByQuoteId(quoteId: string): Deal | undefined {
    return memoryDeals.find((d) => d.quoteId === quoteId);
  },
  updateDealStage(dealId: string, stage: Deal['stage']) {
    memoryDeals = memoryDeals.map((d) => (d.id === dealId ? { ...d, stage } : d));
    notify();
  },
  linkQuote(dealId: string, quoteId: string, amount: number) {
    memoryDeals = memoryDeals.map((d) =>
      d.id === dealId ? { ...d, quoteId, amount, stage: 'proposal' } : d
    );
    notify();
  },
  addDeal(deal: Omit<Deal, 'id'>): Deal {
    const newDeal: Deal = {
      ...deal,
      id: `DEAL-${Date.now().toString().slice(-4)}`,
    };
    memoryDeals = [newDeal, ...memoryDeals];
    notify();
    return newDeal;
  },
  reset() {
    memoryDeals = [...INITIAL_DEALS];
    notify();
  },
};

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>(() => dealStore.getDeals());

  useEffect(() => {
    const handler = () => setDeals(dealStore.getDeals());
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    deals,
    getDeal: dealStore.getDeal,
    updateDealStage: dealStore.updateDealStage,
    linkQuote: dealStore.linkQuote,
    addDeal: dealStore.addDeal,
    resetDeals: dealStore.reset,
  };
}
