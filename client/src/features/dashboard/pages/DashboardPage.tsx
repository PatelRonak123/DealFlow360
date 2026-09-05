import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/Auth';
import { CustomerDashboardPage } from '@/features/customer-portal';
import { SalesRepDashboard } from '../components/SalesRepDashboard';
import {
  SalesManagerDashboard,
  FinanceOpsDashboard,
  AdminDashboard,
} from '../components/OtherRoleDashboards';

/**
 * Role-neutral Dashboard Page Dispatcher
 * Dispatches dashboard content dynamically based on the logged-in user's role.
 * Does not hardcode the page layout specifically as a Sales Rep dashboard.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const rawRole = user?.roles?.[0]?.toLowerCase() || user?.role?.toLowerCase();
  const role: UserRole =
    rawRole === 'sales_representative' || rawRole === 'sales_rep'
      ? 'sales_rep'
      : rawRole === 'sales_manager'
        ? 'sales_manager'
        : rawRole === 'finance_ops' || rawRole === 'finance'
          ? 'finance_ops'
          : rawRole === 'admin'
            ? 'admin'
            : (rawRole as UserRole) || 'customer';

  switch (role) {
    case 'customer':
      return <CustomerDashboardPage />;
    case 'sales_rep':
      return <SalesRepDashboard />;
    case 'sales_manager':
      return <SalesManagerDashboard />;
    case 'finance_ops':
      return <FinanceOpsDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <SalesRepDashboard />;
  }
}
