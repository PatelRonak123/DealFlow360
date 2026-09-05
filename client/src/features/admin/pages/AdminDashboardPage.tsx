import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  Warehouse,
  CalendarClock,
  Shield,
  FileText,
  Activity,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth';
import { useAdminDashboard } from '../hooks/useAdmin';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: metrics, isLoading, isError, error, refetch } = useAdminDashboard();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7ebf7] pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-300">
            <Shield className="h-3 w-3 text-slate-600" />
            System Administration &amp; Governance
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17213a]">
            Administrator Control Center
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Welcome, <strong>{user?.name || 'Administrator'}</strong>. Real-time platform metrics, master catalogs, and access control governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Users className="h-4 w-4" />}
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Failed to load platform metrics</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database connection error'}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Real Live Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Users &amp; Access</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#3568ed]">
              <Users className="h-4.5 w-4.5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#17213a]">
            {isLoading ? '...' : metrics?.users.total ?? 0}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#59657d] border-t border-gray-100 pt-2">
            <span className="text-emerald-600 font-semibold">
              {isLoading ? '...' : metrics?.users.active ?? 0} Active
            </span>
            <span className="text-gray-400">
              {isLoading ? '...' : metrics?.users.inactive ?? 0} Inactive
            </span>
          </div>
        </Card>

        {/* Products */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Products Catalog</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="h-4.5 w-4.5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#17213a]">
            {isLoading ? '...' : metrics?.products.total ?? 0}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#59657d] border-t border-gray-100 pt-2">
            <span className="text-emerald-600 font-semibold">
              {isLoading ? '...' : metrics?.products.active ?? 0} Active
            </span>
            <button
              onClick={() => navigate('/admin/products')}
              className="text-[#3568ed] hover:underline font-medium cursor-pointer"
            >
              Configure &rarr;
            </button>
          </div>
        </Card>

        {/* Warehouses */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Warehouses</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Warehouse className="h-4.5 w-4.5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#17213a]">
            {isLoading ? '...' : metrics?.warehouses.total ?? 0}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#59657d] border-t border-gray-100 pt-2">
            <span className="text-emerald-600 font-semibold">
              {isLoading ? '...' : metrics?.warehouses.active ?? 0} Operational
            </span>
            <button
              onClick={() => navigate('/admin/warehouses')}
              className="text-[#3568ed] hover:underline font-medium cursor-pointer"
            >
              Manage &rarr;
            </button>
          </div>
        </Card>

        {/* Subscription Plans */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-gray-500">Subscription Plans</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CalendarClock className="h-4.5 w-4.5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#17213a]">
            {isLoading ? '...' : metrics?.subscriptionPlans.total ?? 0}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#59657d] border-t border-gray-100 pt-2">
            <span className="text-emerald-600 font-semibold">
              {isLoading ? '...' : metrics?.subscriptionPlans.active ?? 0} Active Tiers
            </span>
            <button
              onClick={() => navigate('/admin/subscription-plans')}
              className="text-[#3568ed] hover:underline font-medium cursor-pointer"
            >
              Plans &rarr;
            </button>
          </div>
        </Card>
      </div>

      {/* Secondary Business Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-gray-500">Customer Accounts</p>
            <p className="text-lg font-bold text-[#17213a]">
              {isLoading ? '...' : metrics?.customers.active ?? 0} Active Organizations
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-gray-500">Quotations Pacing</p>
            <p className="text-lg font-bold text-[#17213a]">
              {isLoading ? '...' : metrics?.quotations.total ?? 0} Total Quotes
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-gray-500">System Governance</p>
            <p className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> 100% Operational
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Access Management */}
        <Card>
          <CardHeader>
            <CardTitle>Access Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a] group-hover:text-[#3568ed] transition">
                    User Accounts Management
                  </p>
                  <p className="text-xs text-gray-500">
                    Create, update, activate/deactivate enterprise users and assign roles
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3568ed] transition" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/roles')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a] group-hover:text-[#3568ed] transition">
                    RBAC Role Configurations
                  </p>
                  <p className="text-xs text-gray-500">
                    Manage system and custom roles with granular permission mappings
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3568ed] transition" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/permissions')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a] group-hover:text-[#3568ed] transition">
                    Security Permissions Matrix
                  </p>
                  <p className="text-xs text-gray-500">
                    Review platform permissions across Quotations, Billing, and Operations
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3568ed] transition" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Business Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Business Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/admin/discount-rules')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a] group-hover:text-[#3568ed] transition">
                    Discount Governance Rules
                  </p>
                  <p className="text-xs text-gray-500">
                    Set Tier &amp; Category discount limits consumed by quote evaluation engine
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3568ed] transition" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/price-lists')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a] group-hover:text-[#3568ed] transition">
                    Price Lists &amp; Custom Pricing
                  </p>
                  <p className="text-xs text-gray-500">
                    Manage standard and enterprise price books for CPQ quote generation
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3568ed] transition" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/settings')}
                className="flex w-full items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-bold text-[#17213a] group-hover:text-[#3568ed] transition">
                    System &amp; Platform Settings
                  </p>
                  <p className="text-xs text-gray-500">
                    Company address, default currency, tax rates, and approval thresholds
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3568ed] transition" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
