import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts';
import { Login, Signup } from '@/features/auth';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/features/dashboard/layouts/DashboardLayout';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';

import { customerPortalRoutes } from '@/features/customer-portal';
// Sales Rep & Shared Modules
import { PipelinePage } from '@/features/deal-health/pages/PipelinePage';
import { QuotationsListPage } from '@/features/quotations/pages/QuotationsListPage';
import { QuoteBuilderPage } from '@/features/quotations/pages/QuoteBuilderPage';
import { QuoteDetailPage } from '@/features/quotations/pages/QuoteDetailPage';
import { CustomersListPage } from '@/features/customers/pages/CustomersListPage';
import { ProductsCatalogPage } from '@/features/products/pages/ProductsCatalogPage';

// Access Control
import { RoleGuard } from '@/components/common/RoleGuard';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
      </Route>

      {/* Protected Application Workspace inside role-independent DashboardLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Dashboard (Dynamic Content Based on Role) */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Customer Portal Routes */}
          {customerPortalRoutes}

          {/* Sales Rep: Deals & Pipeline */}
          <Route
            path="/pipeline"
            element={
              <RoleGuard allowedRoles={['sales_rep', 'sales_manager']} moduleName="Pipeline & Deals">
                <PipelinePage />
              </RoleGuard>
            }
          />
          <Route path="/deals" element={<Navigate to="/pipeline" replace />} />

          {/* Sales Rep: Quotations Lifecycle */}
          <Route
            path="/quotations"
            element={
              <RoleGuard allowedRoles={['sales_rep', 'sales_manager', 'customer']} moduleName="Quotations">
                <QuotationsListPage />
              </RoleGuard>
            }
          />
          <Route
            path="/quotations/new"
            element={
              <RoleGuard allowedRoles={['sales_rep']} moduleName="CPQ Quote Builder">
                <QuoteBuilderPage />
              </RoleGuard>
            }
          />
          <Route
            path="/quotations/:id"
            element={
              <RoleGuard allowedRoles={['sales_rep', 'sales_manager', 'customer', 'finance_ops']} moduleName="Quotation Details">
                <QuoteDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="/quotations/:id/edit"
            element={
              <RoleGuard allowedRoles={['sales_rep']} moduleName="CPQ Quote Editor">
                <QuoteBuilderPage />
              </RoleGuard>
            }
          />

          {/* Customers Directory */}
          <Route
            path="/customers"
            element={
              <RoleGuard allowedRoles={['sales_rep', 'sales_manager', 'admin']} moduleName="Customer Accounts">
                <CustomersListPage />
              </RoleGuard>
            }
          />

          {/* Products Catalog */}
          <Route
            path="/products"
            element={
              <RoleGuard allowedRoles={['sales_rep', 'sales_manager', 'admin']} moduleName="Product Catalog">
                <ProductsCatalogPage />
              </RoleGuard>
            }
          />

          {/* Manager & Finance Protected Routes (Sales Rep Restricted) */}
          <Route
            path="/approvals"
            element={
              <RoleGuard allowedRoles={['sales_manager', 'finance_ops']} moduleName="Multi-Tier Approvals Queue">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Executive Approvals Queue</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Accessible to Sales Managers and Finance Directors only. Sales reps track approval status directly on each quotation.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          <Route
            path="/fulfillment"
            element={
              <RoleGuard allowedRoles={['sales_manager', 'finance_ops']} moduleName="Fulfillment Operations">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Logistics &amp; Carrier Dispatch Console</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Warehouse operations and carrier manifests management.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          <Route
            path="/billing"
            element={
              <RoleGuard allowedRoles={['finance_ops', 'customer']} moduleName="Billing &amp; Invoices">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Commercial Invoicing &amp; Collections</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Restricted to Finance Operations and Customer Accounts.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          <Route
            path="/subscriptions"
            element={
              <RoleGuard allowedRoles={['finance_ops', 'sales_manager']} moduleName="Subscription Management">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Contract Renewals &amp; Mid-Term Amendments</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Restricted to Subscription Operations &amp; Commercial Management.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          <Route
            path="/reports"
            element={
              <RoleGuard allowedRoles={['sales_manager', 'finance_ops', 'admin']} moduleName="Revenue &amp; Pipeline Analytics">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Executive Revenue Analytics</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Cross-team quota pacing and revenue forecasting reports.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          {/* Admin Protected Routes (Sales Rep Restricted) */}
          <Route
            path="/admin/*"
            element={
              <RoleGuard allowedRoles={['admin']} moduleName="System Administration">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">System Administration</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Restricted to System Administrators.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          <Route
            path="/config/*"
            element={
              <RoleGuard allowedRoles={['admin']} moduleName="System Configuration">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Enterprise Price Books &amp; Discount Governance Rules</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Restricted to System Administrators.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;