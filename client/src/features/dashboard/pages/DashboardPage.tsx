import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { normalizeRole, getDashboardPathForRole, ROLES } from '@/lib/accessControl';

/**
 * Intelligent Role Dashboard Resolver
 * Redirects user from generic `/dashboard` to their authorized, role-specific URL
 */
export function DashboardPage() {
  const { user } = useAuth();
  const activeRole = normalizeRole(user?.activeRole || user?.role || ROLES.SALES_REP);
  const targetPath = getDashboardPathForRole(activeRole);

  return <Navigate to={targetPath} replace />;
}

