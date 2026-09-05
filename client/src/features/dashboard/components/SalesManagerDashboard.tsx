import React, { useState } from 'react';
import { ClipboardCheck, Download, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/api/apiClient';
import { PendingApproval, RecentTeamQuote, TeamRep } from '../types';
import { ManagerKpiCards } from './ManagerKpiCards';
import { ApprovalQueueTable } from './ApprovalQueueTable';
import { ApprovalRejectModal } from './ApprovalRejectModal';
import { RepLeaderboard } from './RepLeaderboard';
import { PipelineGovernance } from './PipelineGovernance';
import { TeamRecentQuotes } from './TeamRecentQuotes';

const initialApprovals: PendingApproval[] = [
  {
    id: 'app-1',
    quotationNumber: 'Q-1048',
    customerName: 'Acme Corp Global',
    repName: 'Riya Sharma',
    repEmail: 'riya.s@dealflow360.com',
    amount: '₹ 5,40,000',
    amountRaw: 540000,
    requestedDiscount: 18.5,
    maxRepLimit: 10.0,
    reason: 'Multi-year commitment discount requested for 36-month contract.',
    submittedAt: '2 hours ago',
    status: 'pending',
  },
  {
    id: 'app-2',
    quotationNumber: 'Q-1045',
    customerName: 'Tata Telematics Pvt Ltd',
    repName: 'Rahul Verma',
    repEmail: 'rahul.v@dealflow360.com',
    amount: '₹ 8,90,000',
    amountRaw: 890000,
    requestedDiscount: 22.0,
    maxRepLimit: 10.0,
    reason: 'Competitive bid against Oracle CPQ; required to win enterprise account.',
    submittedAt: '4 hours ago',
    status: 'pending',
  },
  {
    id: 'app-3',
    quotationNumber: 'Q-1042',
    customerName: 'Zenith Logistics',
    repName: 'Sarah Jenkins',
    repEmail: 'sarah.j@dealflow360.com',
    amount: '₹ 3,20,000',
    amountRaw: 320000,
    requestedDiscount: 15.0,
    maxRepLimit: 10.0,
    reason: 'Bulk quantity tier order (500+ seat licenses).',
    submittedAt: 'Yesterday',
    status: 'pending',
  },
  {
    id: 'app-4',
    quotationNumber: 'Q-1039',
    customerName: 'Infospectra Tech',
    repName: 'Vikram Singh',
    repEmail: 'vikram.s@dealflow360.com',
    amount: '₹ 12,50,000',
    amountRaw: 1250000,
    requestedDiscount: 16.5,
    maxRepLimit: 10.0,
    reason: 'Strategic customer expansion across APAC business units.',
    submittedAt: 'Yesterday',
    status: 'pending',
  },
];

const teamReps: TeamRep[] = [
  {
    name: 'Riya Sharma',
    role: 'Senior Sales Rep',
    avatarBg: 'bg-blue-100 text-blue-700',
    quotaTarget: '₹ 25.0 L',
    quotaAchieved: '₹ 23.5 L',
    quotaPercent: 94,
    activeQuotes: 8,
    avgDiscount: 12.4,
    winRate: '72%',
    status: 'Top Performer',
  },
  {
    name: 'Rahul Verma',
    role: 'Enterprise Sales Rep',
    avatarBg: 'bg-emerald-100 text-emerald-700',
    quotaTarget: '₹ 30.0 L',
    quotaAchieved: '₹ 24.2 L',
    quotaPercent: 81,
    activeQuotes: 12,
    avgDiscount: 14.8,
    winRate: '65%',
    status: 'On Track',
  },
  {
    name: 'Sarah Jenkins',
    role: 'Account Executive',
    avatarBg: 'bg-purple-100 text-purple-700',
    quotaTarget: '₹ 20.0 L',
    quotaAchieved: '₹ 14.7 L',
    quotaPercent: 73,
    activeQuotes: 6,
    avgDiscount: 11.2,
    winRate: '58%',
    status: 'Needs Boost',
  },
  {
    name: 'Vikram Singh',
    role: 'Sales Representative',
    avatarBg: 'bg-amber-100 text-amber-700',
    quotaTarget: '₹ 15.0 L',
    quotaAchieved: '₹ 10.5 L',
    quotaPercent: 70,
    activeQuotes: 5,
    avgDiscount: 13.5,
    winRate: '60%',
    status: 'On Track',
  },
];

const teamRecentQuotes: RecentTeamQuote[] = [
  { id: 'Q-1049', customer: 'Nexus Fintech Solutions', rep: 'Riya Sharma', amount: '₹ 4,10,000', discount: '8%', status: 'Approved', tone: 'green' },
  { id: 'Q-1048', customer: 'Acme Corp Global', rep: 'Riya Sharma', amount: '₹ 5,40,000', discount: '18.5%', status: 'Pending Approval', tone: 'amber' },
  { id: 'Q-1047', customer: 'CloudMatrix Networks', rep: 'Rahul Verma', amount: '₹ 2,85,000', discount: '5%', status: 'Sent to Customer', tone: 'blue' },
  { id: 'Q-1046', customer: 'Vertex Dynamics', rep: 'Sarah Jenkins', amount: '₹ 6,30,000', discount: '9%', status: 'Draft', tone: 'gray' },
  { id: 'Q-1045', customer: 'Tata Telematics Pvt Ltd', rep: 'Rahul Verma', amount: '₹ 8,90,000', discount: '22%', status: 'Pending Approval', tone: 'amber' },
];

export function SalesManagerDashboard({ userName = 'Rajesh Malhotra' }: { userName?: string }) {
  const [approvals, setApprovals] = useState<PendingApproval[]>(initialApprovals);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      try {
        await apiClient.post(`/approvals/${id}/approve`, {
          comments: 'Approved by Sales Manager',
        });
      } catch {
        // Fallback for demo
      }

      setApprovals((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'approved' } : app))
      );

      toast.success(`Quotation ${id} discount approved! Rep notified.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async (id: string, reasonComment: string) => {
    setIsProcessing(true);
    try {
      try {
        await apiClient.post(`/approvals/${id}/reject`, {
          comments: reasonComment || 'Discount rejected by Sales Manager',
        });
      } catch {
        // Fallback for demo
      }

      setApprovals((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: 'rejected' } : app))
      );

      toast.error(`Quotation ${id} discount rejected. Rep notified.`);
      setSelectedApproval(null);
      setComment('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Executive Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#e7ebf7] bg-gradient-to-r from-white via-white to-[#f0f4ff] p-7 shadow-[0_8px_24px_rgba(64,86,145,0.06)] md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <ShieldCheck size={14} />
            Executive Sales Governance
          </div>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-[#17213a]">
            Sales Manager Workspace
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Welcome back, <span className="font-semibold text-[#17213a]">{userName}</span>. You have{' '}
            <span className="font-bold text-amber-600">{pendingCount} quotes</span> requiring discount approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toast.success('Team quota and pipeline report exported!')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e7ebf7] bg-white px-4 py-2.5 text-xs font-semibold text-[#3568ed] shadow-sm transition hover:bg-[#f0f4ff]"
          >
            <Download size={14} />
            Export Team Report
          </button>
          <a
            href="#approvals-queue"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3568ed] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#3568ed]/20 transition hover:bg-[#2856ce]"
          >
            <ClipboardCheck size={14} />
            Review {pendingCount} Approvals
          </a>
        </div>
      </div>

      {/* Top 4 Manager KPIs */}
      <ManagerKpiCards pendingCount={pendingCount} />

      {/* Actionable Approvals Queue */}
      <ApprovalQueueTable
        approvals={approvals}
        isProcessing={isProcessing}
        onApprove={handleApprove}
        onRejectClick={(app) => setSelectedApproval(app)}
      />

      {/* 2 Column: Rep Leaderboard & Pipeline Governance */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <RepLeaderboard reps={teamReps} />
        <PipelineGovernance />
      </section>

      {/* Cross-Team Recent Quotes */}
      <TeamRecentQuotes quotes={teamRecentQuotes} />

      {/* Rejection Modal */}
      <ApprovalRejectModal
        approval={selectedApproval}
        comment={comment}
        isProcessing={isProcessing}
        onCommentChange={setComment}
        onClose={() => setSelectedApproval(null)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}

export default SalesManagerDashboard;
