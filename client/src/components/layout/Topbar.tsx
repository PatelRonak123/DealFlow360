import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { RoleBadge } from '@/components/common/RoleBadge';
import { useAuth } from '@/features/auth';
import { useCustomerProfile } from '@/features/customer-portal/hooks/useCustomerProfile';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/Auth';

export function Topbar({ notificationCount = 3 }: { notificationCount?: number }) {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const notifications = [
    {
      id: 'N-1',
      title: 'Quote Q-1024 Submitted',
      description: 'Tata Consultancy Services quote pending Sales Manager approval',
      time: '15m ago',
      icon: Clock,
      color: 'text-amber-500 bg-amber-50',
      link: '/quotations/Q-1024',
    },
    {
      id: 'N-2',
      title: 'Counter-Offer Received',
      description: 'Infosys FinTech requested 23% discount on Q-1023 (Re-approval required)',
      time: '1h ago',
      icon: AlertTriangle,
      color: 'text-red-500 bg-red-50',
      link: '/quotations/Q-1023',
    },
    {
      id: 'N-3',
      title: 'Deal Won & Payment Confirmed',
      description: 'Apex Retailers PO confirmed for Q-1021 (₹ 3,10,000)',
      time: '3h ago',
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50',
      link: '/quotations/Q-1021',
    },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-18 items-center justify-between gap-6 border-b border-[#e7ebf7] bg-white/95 px-8 backdrop-blur shadow-[0_2px_12px_rgba(61,82,140,0.04)]">
      {/* Search Input */}
      <div className="flex h-10 w-full max-w-sm items-center gap-3 rounded-xl border border-[#e4e9f7] bg-[#f7f8ff] px-3.5 text-[#8491aa] focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition-all">
        <Search className="h-4 w-4 shrink-0 text-[#8491aa]" />
        <input
          type="text"
          placeholder="Search quotes, deals, accounts..."
          className="w-full bg-transparent text-sm text-[#17213a] placeholder:text-[#8491aa] focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7ebf7] hover:border-[#cad7f5] hover:bg-[#f0f3ff] transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5 text-[#59657d]" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow-xs">
                {notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="mb-3 flex items-center justify-between border-b border-[#eef2f9] pb-2.5">
                <h4 className="text-sm font-bold text-[#17213a]">Deal Alerts & Activity</h4>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#3568ed]">
                  {notifications.length} new
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(n.link);
                      }}
                      className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-[#f8faff] transition cursor-pointer"
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#17213a] truncate">{n.title}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#71809f] line-clamp-2">{n.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge */}
        <RoleBadge role={user?.role || role} />

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf2fe] border border-[#d2defa] text-[#3568ed] font-bold text-xs shadow-2xs">
            {displayName
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-xs font-bold text-[#17213a] leading-none">{displayName}</p>
            <p className="mt-1 text-[10px] font-medium text-[#71809f] leading-none">
              {user?.title || role.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out"
          className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e7ebf7] px-3 py-1 text-xs font-medium text-[#59657d] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}