export interface PendingApproval {
  id: string;
  quotationNumber: string;
  customerName: string;
  repName: string;
  repEmail: string;
  amount: string;
  amountRaw: number;
  requestedDiscount: number;
  maxRepLimit: number;
  reason: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface TeamRep {
  name: string;
  role: string;
  avatarBg: string;
  quotaTarget: string;
  quotaAchieved: string;
  quotaPercent: number;
  activeQuotes: number;
  avgDiscount: number;
  winRate: string;
  status: string;
}

export interface RecentTeamQuote {
  id: string;
  customer: string;
  rep: string;
  amount: string;
  discount: string;
  status: string;
  tone: 'green' | 'amber' | 'blue' | 'gray';
}
