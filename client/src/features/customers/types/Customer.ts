export type CustomerTier = 'Bronze' | 'Silver' | 'Gold';

export interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: CustomerTier;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: 'Net 30' | 'Net 45' | 'Net 60';
  creditLimit: number;
  discountAllowancePercent: number; // Max standard discount without manager escalation
  healthScore: number;
  salesRepId: string;
}
