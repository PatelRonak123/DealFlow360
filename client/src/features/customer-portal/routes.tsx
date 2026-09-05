import { Route, Navigate } from 'react-router-dom';
import {
  CustomerDashboardPage,
  MyQuotationsPage,
  QuotationDetailsPage,
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
} from './pages';

export const customerPortalRoutes = (
  <>
    <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
    <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />

    <Route path="/customer/quotations" element={<MyQuotationsPage />} />
    <Route path="/customer/quotations/:id" element={<QuotationDetailsPage />} />
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
  </>
);
