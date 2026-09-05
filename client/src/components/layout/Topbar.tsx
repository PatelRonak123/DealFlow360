import { Bell, Search, UserRound, LogOut } from 'lucide-react';
import { RoleBadge } from '@/components/common/RoleBadge';
import { useAuth } from '@/features/auth';
import { useCustomerProfile } from '@/features/customer-portal/hooks/useCustomerProfile';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/Auth';

export function Topbar({ notificationCount = 0 }: { notificationCount?: number }) {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();

  const rawRole = user?.roles?.[0]?.toLowerCase();
  const role: UserRole =
    rawRole === 'sales_representative' || rawRole === 'sales_rep'
      ? 'sales_rep'
      : rawRole === 'sales_manager'
      ? 'sales_manager'
      : rawRole === 'finance_ops' || rawRole === 'finance'
      ? 'finance_ops'
      : rawRole === 'admin'
      ? 'admin'
      : 'customer';

  const isCustomer = role === 'customer';

  // If customer role and user?.name is not yet known, optionally fetch profile data
  const { data: customerProfile, isLoading: isProfileLoading } = useCustomerProfile({
    enabled: isCustomer && !user?.name,
  });

  const isNameLoading = isAuthLoading || (isCustomer && isProfileLoading && !user?.name);

  // Dynamic customer / user display name resolution
  let displayName: string;
  if (isNameLoading) {
    displayName = 'Loading...';
  } else if (user?.name) {
    displayName = user.name;
  } else if (isCustomer && (customerProfile?.contactName || customerProfile?.companyName)) {
    displayName = customerProfile.contactName || customerProfile.companyName;
  } else {
    displayName = isCustomer ? 'Customer' : 'User';
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-18 items-center justify-between gap-6 border-b border-[#e7ebf7] bg-white px-8 shadow-[0_2px_12px_rgba(61,82,140,0.04)]">
      <div className="flex h-10 w-full max-w-sm items-center gap-3 rounded-xl border border-[#e4e9f7] bg-[#f7f8ff] px-3 text-[#8491aa]">
        <Search className="h-4 w-4" />
        <span className="text-sm">Search anything...</span>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f0f3ff]">
          <Bell className="h-5 w-5 text-[#63708a]" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <RoleBadge role={role} />

        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ff]"
            aria-label={`${displayName} profile`}
          >
            <UserRound className="h-5 w-5 text-[#5271c9]" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-gray-900">{displayName}</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e7ebf7] px-2.5 py-1 text-xs font-medium text-[#59657d] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}