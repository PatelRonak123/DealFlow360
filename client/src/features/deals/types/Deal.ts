import { CustomerTier } from '@/features/customers/types/Customer';

export type DealStage =
  | 'discovery'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export type DealHealthStatus =
  | 'healthy'
  | 'stalled'
  | 'discount_anomaly'
  | 'delivery_risk';

export interface Deal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  customerTier: CustomerTier;
  stage: DealStage;
  amount: number;
  winProbability: number; // 0 to 100
  health: DealHealthStatus;
  healthReason?: string;
  expectedCloseDate: string;
  quoteId?: string;
  lastActivityDays: number;
  salesRepName: string;
  notes?: string;
}
