import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthLayout } from '../layouts';
import { Login, Signup } from '@/features/auth';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/features/dashboard/layouts/DashboardLayout';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';

// Dashboards
import { SalesRepDashboard } from '@/features/dashboard/components/SalesRepDashboard';
import {
  SalesManagerDashboard,
  FinanceDashboard,
  AdminDashboard,
} from '@/features/dashboard/components/OtherRoleDashboards';

// Customer Portal Pages
import {
  CustomerDashboardPage,
  MyQuotationsPage,
  QuotationDetailsPage as CustomerQuotationDetailPage,
  QuotationNegotiatePage,
  CustomerOrdersPage,
  CustomerOrderDetailsPage,
  CustomerInvoicesPage,
  CustomerInvoiceDetailsPage,
  CustomerPaymentsPage,
  CustomerSubscriptionsPage,
  CustomerSubscriptionDetailsPage,
  CustomerNotificationsPage,
  CustomerProfilePage,
} from '@/features/customer-portal/pages';

// Sales Rep & Domain Modules
import { PipelinePage } from '@/features/deal-health/pages/PipelinePage';
import { QuotationsListPage } from '@/features/quotations/pages/QuotationsListPage';
import { QuoteBuilderPage } from '@/features/quotations/pages/QuoteBuilderPage';
import { QuoteDetailPage } from '@/features/quotations/pages/QuoteDetailPage';
import { CustomersListPage } from '@/features/customers/pages/CustomersListPage';
import { ProductsCatalogPage } from '@/features/products/pages/ProductsCatalogPage';

// Access Control
import { RoleGuard } from '@/components/common/RoleGuard';
import { ROLES } from '@/lib/accessControl';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
      </Route>

      {/* Protected Application Workspace */}
      <Route element={<ProtectedRoute />}>
        {/* Unified Dashboard Layout with Sidebar & Topbar for all roles (Customer, Sales Rep, Sales Manager, Finance, Admin) */}
        <Route element={<DashboardLayout />}>
          {/* Intelligent Role Dashboard Resolver */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* 1. CUSTOMER PORTAL */}
          <Route
            element={
              <RoleGuard allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]} moduleName="Customer Portal">
                <Outlet />
              </RoleGuard>
            }
          >
            <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
            <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/customer/quotations" element={<MyQuotationsPage />} />
            <Route path="/customer/quotations/:id" element={<CustomerQuotationDetailPage />} />
            <Route path="/customer/quotations/:id/negotiate" element={<QuotationNegotiatePage />} />
            <Route path="/customer/orders" element={<CustomerOrdersPage />} />
            <Route path="/customer/orders/:id" element={<CustomerOrderDetailsPage />} />
            <Route path="/customer/invoices" element={<CustomerInvoicesPage />} />
            <Route path="/customer/invoices/:id" element={<CustomerInvoiceDetailsPage />} />
            <Route path="/customer/payments" element={<CustomerPaymentsPage />} />
            <Route path="/customer/subscriptions" element={<CustomerSubscriptionsPage />} />
            <Route path="/customer/subscriptions/:id" element={<CustomerSubscriptionDetailsPage />} />
            <Route path="/customer/notifications" element={<CustomerNotificationsPage />} />
            <Route path="/customer/profile" element={<CustomerProfilePage />} />
          </Route>

          {/* 2. INTERNAL ENTERPRISE WORKSPACES */}
          <Route
            element={
              <RoleGuard
                allowedRoles={[
                  ROLES.ADMIN,
                  ROLES.SALES_REP,
                  ROLES.SALES_MANAGER,
                  ROLES.FINANCE,
                ]}
                moduleName="Internal Workspace"
              >
                <Outlet />
              </RoleGuard>
            }
          >
          {/* Dedicated Role Dashboards - strictly isolated per role */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleGuard allowedRoles={[ROLES.ADMIN]} moduleName="Admin Control Center">
                <AdminDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/sales/dashboard"
            element={
              <RoleGuard
                allowedRoles={[ROLES.SALES_REP, ROLES.ADMIN]}
                moduleName="Sales Representative Workspace"
              >
                <SalesRepDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/manager/dashboard"
            element={
              <RoleGuard allowedRoles={[ROLES.SALES_MANAGER, ROLES.ADMIN]} moduleName="Sales Manager Workspace">
                <SalesManagerDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/finance/dashboard"
            element={
              <RoleGuard
                allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}
                moduleName="Commercial Finance Workspace"
              >
                <FinanceDashboard />
              </RoleGuard>
            }
          />

          {/* Sales Workspace: Deals & Pipeline */}
          <Route
            path="/pipeline"
            element={
              <RoleGuard allowedRoles={[ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN]} moduleName="Pipeline & Deals">
                <PipelinePage />
              </RoleGuard>
            }
          />
          <Route path="/deals" element={<Navigate to="/pipeline" replace />} />

          {/* Sales Workspace: Quotations Lifecycle */}
          <Route
            path="/quotations"
            element={
              <RoleGuard allowedRoles={[ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN]} moduleName="Quotations">
                <QuotationsListPage />
              </RoleGuard>
            }
          />
          <Route
            path="/quotations/new"
            element={
              <RoleGuard allowedRoles={[ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN]} moduleName="CPQ Quote Builder">
                <QuoteBuilderPage />
              </RoleGuard>
            }
          />
          <Route
            path="/quotations/:id"
            element={
              <RoleGuard
                allowedRoles={[
                  ROLES.SALES_REP,
                  ROLES.SALES_MANAGER,
                  ROLES.FINANCE,
                  ROLES.ADMIN,
                ]}
                moduleName="Quotation Details"
              >
                <QuoteDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="/quotations/:id/edit"
            element={
              <RoleGuard allowedRoles={[ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN]} moduleName="CPQ Quote Editor">
                <QuoteBuilderPage />
              </RoleGuard>
            }
          />

          {/* Customers Directory */}
          <Route
            path="/customers"
            element={
              <RoleGuard allowedRoles={[ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN]} moduleName="Customer Accounts">
                <CustomersListPage />
              </RoleGuard>
            }
          />

          {/* Products Catalog */}
          <Route
            path="/products"
            element={
              <RoleGuard
                allowedRoles={[ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN]}
                moduleName="Product Catalog"
              >
                <ProductsCatalogPage />
              </RoleGuard>
            }
          />

          {/* Manager & Finance Protected Routes */}
          <Route
            path="/approvals"
            element={
              <RoleGuard
                allowedRoles={[ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN]}
                moduleName="Multi-Tier Approvals Queue"
              >
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Executive Approvals Queue</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Accessible to Sales Managers, Finance Officers, and Administrators. Sales reps track approval status directly on each quotation.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          {/* Fulfillment Protected Routes */}
          <Route
            path="/fulfillment"
            element={
              <RoleGuard
                allowedRoles={[ROLES.SALES_MANAGER, ROLES.ADMIN]}
                moduleName="Fulfillment Operations"
              >
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Logistics &amp; Carrier Dispatch Console</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Warehouse operations and carrier manifests management.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          {/* Billing & Subscriptions */}
          <Route
            path="/billing"
            element={
              <RoleGuard
                allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}
                moduleName="Billing &amp; Invoices"
              >
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Commercial Invoicing &amp; Collections</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Restricted to Commercial Finance and Administrators.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          <Route
            path="/subscriptions"
            element={
              <RoleGuard
                allowedRoles={[ROLES.FINANCE, ROLES.SALES_MANAGER, ROLES.ADMIN]}
                moduleName="Subscription Management"
              >
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Contract Renewals &amp; Mid-Term Amendments</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Restricted to Finance, Sales Management &amp; Administrators.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          <Route
            path="/reports"
            element={
              <RoleGuard
                allowedRoles={[ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN]}
                moduleName="Revenue &amp; Pipeline Analytics"
              >
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Executive Revenue Analytics</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Cross-team quota pacing and revenue forecasting reports.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/*"
            element={
              <RoleGuard allowedRoles={[ROLES.ADMIN]} moduleName="System Administration">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">System Administration &amp; Governance</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    User Accounts, RBAC matrix, and security auditing logs.
                  </p>
                </div>
              </RoleGuard>
            }
          />

          <Route
            path="/config/*"
            element={
              <RoleGuard allowedRoles={[ROLES.ADMIN]} moduleName="System Configuration">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs">
                  <h2 className="text-xl font-bold text-[#17213a]">Enterprise Price Books &amp; Discount Governance Rules</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure master discount policies, customer tiers, and fulfillment warehouses.
                  </p>
                </div>
              </RoleGuard>
            }
          />
        </Route>
      </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;