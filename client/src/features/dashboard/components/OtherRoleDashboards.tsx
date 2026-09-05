import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ShieldCheck, BarChart2, DollarSign } from 'lucide-react';
import { useAuth } from '@/features/auth';

export const SalesManagerDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-[#e7ebf7] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            Sales Manager Workspace
          </span>
          <h1 className="mt-2 text-2xl font-bold text-[#17213a]">Welcome, {user.name}!</h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Overview of team pipeline, quota achievement, and deals requiring manager signoff.
          </p>
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
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Manager Module</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This module is designated for the <strong>Sales Manager</strong> role.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const FinanceOpsDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-[#e7ebf7] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Finance & Revenue Operations Workspace
          </span>
          <h1 className="mt-2 text-2xl font-bold text-[#17213a]">Welcome, {user.name}!</h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Commercial margin controls, payment terms oversight, and billing milestone schedules.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase">Total AR Outstanding</p>
          <p className="text-xl font-bold text-[#17213a] mt-1">₹ 42.15 L</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase">High-Discount Deals</p>
          <p className="text-xl font-bold text-[#17213a] mt-1">2 Pending Review</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase">Gross Margin Floor</p>
          <p className="text-xl font-bold text-[#17213a] mt-1">20.0% Enforced</p>
        </Card>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-[#e7ebf7] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-300">
            System & Governance Administration
          </span>
          <h1 className="mt-2 text-2xl font-bold text-[#17213a]">Administrator Control Center ({user.name})</h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Configure price books, discount rules, multi-warehouse nodes, and user permissions.
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <p className="text-sm text-gray-600 py-4">
            System governance is operating normally. User roles, category ceilings, and discount policies are active.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
