import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  LogOut,
  CheckCircle2,
  Clock,
  ChevronDown,
  Layers,
  FileText,
  Boxes,
  Receipt,
  CreditCard,
  XCircle,
  Tag,
  ArrowRight,
  CheckCheck,
} from 'lucide-react';
import { RoleBadge } from '@/components/common/RoleBadge';
import { useAuth } from '@/features/auth';
import { useCustomerProfile } from '@/features/customer-portal/hooks/useCustomerProfile';
import { useAppNotifications } from '@/features/notifications/hooks/useAppNotifications';
import { useNavigate } from 'react-router-dom';
import { normalizeRole, getDashboardPathForRole, ROLES } from '@/lib/accessControl';
import { UserRole } from '@/types/Auth';

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (isNaN(diffSec) || diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

function getNotificationVisual(type: string, status?: string) {
  if (status === 'REJECTED' || type === 'REJECTION') {
    return { icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' };
  }
  if (status === 'APPROVED' || type === 'APPROVAL') {
    return { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  }

  switch (type) {
    case 'QUOTATION':
      return { icon: FileText, color: 'text-[#3568ed] bg-blue-50 border-blue-200' };
    case 'NEGOTIATION':
      return { icon: Tag, color: 'text-amber-600 bg-amber-50 border-amber-200' };
    case 'ORDER':
      return { icon: Boxes, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
    case 'INVOICE':
      return { icon: Receipt, color: 'text-purple-600 bg-purple-50 border-purple-200' };
    case 'PAYMENT':
      return { icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    default:
      return { icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200' };
  }
}

export function Topbar() {
  const { user, isLoading: isAuthLoading, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const activeRole = normalizeRole(user?.roles?.[0] || user?.activeRole || user?.role || ROLES.SALES_REP);
  const isCustomer = activeRole === ROLES.CUSTOMER;

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useAppNotifications(activeRole);

  // Available roles for switching: All assigned user roles, or full set if Admin
  const availableRoles: UserRole[] =
    activeRole === ROLES.ADMIN
      ? [ROLES.ADMIN, ROLES.SALES_MANAGER, ROLES.SALES_REP, ROLES.FINANCE, ROLES.CUSTOMER]
      : (user?.roles && user.roles.length > 0 ? user.roles : [activeRole]);

  // If customer role and user?.name is not yet known, optionally fetch profile data
  const { data: customerProfile, isLoading: isProfileLoading } = useCustomerProfile({
    userEmail: user?.email,
    enabled: isCustomer && !user?.name && Boolean(user?.email),
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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleSwitcher(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSwitchRole = (newRole: UserRole) => {
    switchRole(newRole);
    setShowRoleSwitcher(false);
    const targetDashboard = getDashboardPathForRole(newRole);
    navigate(targetDashboard);
  };

  const handleNotificationClick = (id: string, linkUrl?: string) => {
    markAsRead(id);
    setShowNotifications(false);
    if (linkUrl) {
      navigate(linkUrl);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-18 shrink-0 items-center justify-between gap-6 border-b border-[#e7ebf7] bg-white/95 px-8 backdrop-blur shadow-[0_2px_12px_rgba(61,82,140,0.04)]">
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
        {/* Dynamic Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7ebf7] hover:border-[#cad7f5] hover:bg-[#f0f3ff] transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5 text-[#59657d]" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="mb-3 flex items-center justify-between border-b border-[#eef2f9] pb-2.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#17213a]">Deal Alerts & Activity</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#3568ed]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3568ed] hover:underline cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-[#647592]">No notifications yet</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Live updates and audit alerts will appear here.
                  </p>
                </div>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {notifications.slice(0, 8).map((n) => {
                    const visual = getNotificationVisual(n.type, n.status);
                    const Icon = visual.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n.id, n.linkUrl)}
                        className={`flex items-start gap-3 rounded-xl p-2.5 transition cursor-pointer ${
                          n.isRead
                            ? 'hover:bg-[#f8faff] opacity-80'
                            : 'bg-[#f8faff]/90 border border-[#3568ed]/15 shadow-2xs hover:bg-[#f0f4ff]'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${visual.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-[#17213a] truncate">{n.title}</p>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#71809f] line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Contextual Link */}
              <div className="mt-3 border-t border-[#eef2f9] pt-2 text-center">
                {isCustomer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/customer/notifications');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3568ed] hover:underline cursor-pointer"
                  >
                    <span>View all notifications</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : activeRole === ROLES.SALES_MANAGER || activeRole === ROLES.FINANCE ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/approvals');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3568ed] hover:underline cursor-pointer"
                  >
                    <span>View Approvals Queue</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/quotations');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3568ed] hover:underline cursor-pointer"
                  >
                    <span>View All Quotations</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge / Workspace Switcher */}
        <div className="relative" ref={roleRef}>
          {availableRoles.length > 1 ? (
            <button
              type="button"
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-1.5 cursor-pointer rounded-lg hover:opacity-90 transition"
              title="Click to switch active workspace role"
            >
              <RoleBadge role={activeRole} />
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
          ) : (
            <RoleBadge role={activeRole} />
          )}

          {showRoleSwitcher && availableRoles.length > 1 && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#e7ebf7] bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 border-b border-gray-100 mb-1 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Switch Workspace
                </span>
              </div>
              <div className="space-y-1">
                {availableRoles.map((r) => {
                  const norm = normalizeRole(r);
                  const isCurrent = norm === activeRole;
                  return (
                    <button
                      key={norm}
                      type="button"
                      onClick={() => handleSwitchRole(norm)}
                      className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50 text-[#3568ed] font-bold'
                          : 'text-[#17213a] hover:bg-gray-50'
                      }`}
                    >
                      <span>{norm.replace(/_/g, ' ')}</span>
                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-[#3568ed]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
              {user?.title || activeRole.replace(/_/g, ' ')}
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
