export interface RevenueKpis {
  totalRevenueBooked: number;
  projectedPipelineValue: number;
  totalDealsWon: number;
  openPipelineDeals: number;
  averageDealSize: number;
  quotaTarget: number;
  quotaAttainmentPct: number;
  avgDiscountPct: number;
  totalDiscountGiven: number;
  marginRetentionPct: number;
}

export interface MonthlyTrendItem {
  month: string;
  bookedRevenue: number;
  target: number;
  pipeline: number;
}

export interface CategoryBreakdownItem {
  category: string;
  revenue: number;
  percentage: number;
  dealCount: number;
}

export interface TierBreakdownItem {
  tierName: string;
  revenue: number;
  percentage: number;
  dealCount: number;
}

export interface RepPerformanceItem {
  repId: string;
  name: string;
  email: string;
  bookedRevenue: number;
  pipelineValue: number;
  quotaTarget: number;
  attainmentPct: number;
  dealsCount: number;
  avgDiscount: number;
}

export interface StageFunnelItem {
  stage: string;
  label: string;
  count: number;
  value: number;
  conversionPct: number;
}

export interface RevenueAnalyticsResponse {
  kpis: RevenueKpis;
  monthlyTrends: MonthlyTrendItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  tierBreakdown: TierBreakdownItem[];
  repPerformance: RepPerformanceItem[];
  stageFunnel: StageFunnelItem[];
  generatedAt: string;
}
