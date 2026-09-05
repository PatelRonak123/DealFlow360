import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  ShieldCheck,
  BarChart2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';

export const SalesManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7ebf7] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            Sales Manager Workspace
          </span>
          <h1 className="mt-2 text-2xl font-bold text-[#17213a]">Welcome, {user.name}!</h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Overview of team pipeline velocity, discount governance escalations, and executive approvals.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/approvals')}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 transition cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            Approvals Queue (3)
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <BarChart2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Team Quota</p>
              <p className="text-xl font-bold text-[#17213a]">₹ 1.84 Cr / ₹ 2.50 Cr</p>
              <p className="text-[11px] text-emerald-600 font-medium">73.6% achieved (On Track)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Pending Approvals</p>
              <p className="text-xl font-bold text-[#17213a]">3 Quotes</p>
              <p className="text-[11px] text-amber-600 font-medium">2 High-Discount Escalations</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Average Discount</p>
              <p className="text-xl font-bold text-[#17213a]">16.4%</p>
              <p className="text-[11px] text-blue-600 font-medium">Target Ceiling: 20.0%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manager Governance Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/approvals')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-purple-50/50 hover:border-purple-200 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Multi-Tier Approvals Queue</p>
                  <p className="text-xs text-gray-500">Review quotes with &gt;10% requested discount</p>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-600" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/pipeline')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-purple-50/50 hover:border-purple-200 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Team Deals &amp; Health</p>
                  <p className="text-xs text-gray-500">Monitor deal velocity and win probabilities</p>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-600" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/reports')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-purple-50/50 hover:border-purple-200 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Revenue &amp; Quota Reports</p>
                  <p className="text-xs text-gray-500">Rep-by-rep pipeline forecasting</p>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-600" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Pacing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Riya Patel (Senior Rep)</span>
                <span className="font-bold text-emerald-600">₹ 94.5 L / ₹ 1.00 Cr (94%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94%' }} />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="font-semibold text-gray-700">Aditya Sharma (Enterprise Rep)</span>
                <span className="font-bold text-blue-600">₹ 58.2 L / ₹ 80.0 L (72%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }} />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="font-semibold text-gray-700">Kavita Reddy (Commercial Rep)</span>
                <span className="font-bold text-amber-600">₹ 31.3 L / ₹ 70.0 L (45%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7ebf7] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Commercial Finance &amp; Revenue Operations
          </span>
          <h1 className="mt-2 text-2xl font-bold text-[#17213a]">Welcome, {user.name}!</h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Commercial margin controls, high-risk approval signoffs, billing schedules, and collections.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            <Receipt className="h-4 w-4" />
            Billing Console
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Total AR Outstanding</p>
              <p className="text-xl font-bold text-[#17213a]">₹ 42.15 L</p>
              <p className="text-[11px] text-emerald-600 font-medium">92% current / 8% &gt;30 days</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Tier-2 Finance Approvals</p>
              <p className="text-xl font-bold text-[#17213a]">2 Pending</p>
              <p className="text-[11px] text-amber-600 font-medium">Discount &gt;20% Requiring Signoff</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Gross Margin Floor</p>
              <p className="text-xl font-bold text-[#17213a]">20.0% Enforced</p>
              <p className="text-[11px] text-blue-600 font-medium">Platform-wide policy active</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Finance Operations Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-emerald-50/50 hover:border-emerald-200 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Invoicing &amp; Billing Milestone Schedules</p>
                  <p className="text-xs text-gray-500">Manage tax invoices and milestone dispatch triggers</p>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/approvals')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-emerald-50/50 hover:border-emerald-200 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Finance Signoff Queue</p>
                  <p className="text-xs text-gray-500">Approve or override high-discount enterprise quotes</p>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/subscriptions')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-emerald-50/50 hover:border-emerald-200 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Subscription Contracts &amp; ARR</p>
                  <p className="text-xs text-gray-500">Recurring revenue amendments and renewals</p>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-600" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Financial Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-[#17213a]">Q-1024 (ABC Industries)</p>
                  <p className="text-[11px] text-gray-500">₹ 8,00,000 (15% Discount approved)</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-[#17213a]">Q-1023 (Infosys FinTech)</p>
                  <p className="text-[11px] text-gray-500">₹ 14,50,000 (23% Discount requested)</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5" /> Tier 2 Pending
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7ebf7] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-300">
            System &amp; Governance Administration
          </span>
          <h1 className="mt-2 text-2xl font-bold text-[#17213a]">Administrator Control Center</h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Welcome, <strong>{user.name}</strong>. Configure price books, discount rules, multi-warehouse nodes, and RBAC user permissions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 rounded-xl bg-[#17213a] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            User &amp; Role Management
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase">Platform Roles</p>
          <p className="text-2xl font-bold text-[#17213a] mt-1">5 Roles Active</p>
          <p className="text-[11px] text-emerald-600 font-medium">RBAC Synchronized</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase">Discount Governance</p>
          <p className="text-2xl font-bold text-[#17213a] mt-1">3 Tiers</p>
          <p className="text-[11px] text-blue-600 font-medium">Auto / Mgr / Finance</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase">Price Lists</p>
          <p className="text-2xl font-bold text-[#17213a] mt-1">Enterprise Books</p>
          <p className="text-[11px] text-purple-600 font-medium">Tier-based pricing</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase">System Health</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">100% Operational</p>
          <p className="text-[11px] text-gray-500 font-medium">DealFlow360 API v1.0</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Governance &amp; Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/config/discount-rules')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Discount Governance Thresholds</p>
                  <p className="text-xs text-gray-500">Set manager and finance approval ceilings</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/config/products')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Product Books &amp; Pricing</p>
                  <p className="text-xs text-gray-500">Configure base catalogs and margin floors</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/config/warehouses')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Warehouses &amp; Fulfillment Nodes</p>
                  <p className="text-xs text-gray-500">Manage regional hubs and dispatch centers</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administrative Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">User Accounts &amp; RBAC Roles</p>
                  <p className="text-xs text-gray-500">Assign roles and manage team accounts</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/config/subscription-plans')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a]">Subscription Tiers &amp; Billing Cycles</p>
                  <p className="text-xs text-gray-500">Configure recurring contract plans</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

