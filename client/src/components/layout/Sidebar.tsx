import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Shield,
  Briefcase,
  TrendingUp,
  CreditCard,
  Building,
} from 'lucide-react';
import { getNavForRole, NavItem } from '@/config/Navigation';
import { useAuth } from '@/features/auth';
import { useCustomerProfile } from '@/features/customer-portal/hooks/useCustomerProfile';
import { normalizeRole, getRoleTitle, ROLES } from '@/lib/accessControl';
import { useSidebar } from '@/context/SidebarContext';

export function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();

  const activeRole = normalizeRole(user?.roles?.[0] || user?.activeRole || user?.role || ROLES.SALES_REP);
  const isCustomer = activeRole === ROLES.CUSTOMER;
  const sections = getNavForRole(activeRole);

  // Fetch real customer organization profile for customer users
  const { data: customerProfile, isLoading: isProfileLoading } = useCustomerProfile({
    userEmail: user?.email,
    enabled: isCustomer && Boolean(user?.email),
  });

  // Resolve user, company, and email from real auth state and customer profile
  const userName = user?.name || customerProfile?.contactName || 'Customer';
  const companyName = customerProfile?.companyName || user?.customer?.companyName || '';
  const userEmail = user?.email || customerProfile?.email || '';

  // Generate user initials for avatar
  const userInitials =
    (userName || 'Customer')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CU';

  const getRoleIcon = () => {
    switch (activeRole) {
      case ROLES.ADMIN:
        return Shield;
      case ROLES.FINANCE:
        return CreditCard;
      case ROLES.SALES_MANAGER:
        return TrendingUp;
      case ROLES.SALES_REP:
        return Briefcase;
      case ROLES.CUSTOMER:
      default:
        return Building;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r border-[#e7ebf7] bg-white transition-all duration-300 ease-in-out select-none shadow-[4px_0_24px_rgba(61,82,140,0.03)]
          ${isCollapsed ? 'w-20 px-2.5 py-5' : 'w-64 px-4 py-5'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        {!isCollapsed ? (
          <div className="mb-6 flex items-center justify-between px-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3568ed] text-white shadow-[0_8px_18px_rgba(53,104,237,0.22)]">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div className="min-w-0 truncate">
                <p className="text-base font-bold tracking-tight text-[#17213a] truncate">DealFlow360</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8491aa] truncate">
                  Deal intelligence
                </p>
              </div>
            </div>

            {/* Collapse button on desktop */}
            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse sidebar"
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-[#8491aa] hover:bg-[#f0f3ff] hover:text-[#3568ed] transition-colors cursor-pointer"
            >
              <PanelLeftClose className="h-4.5 w-4.5" />
            </button>

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={closeMobileSidebar}
              title="Close navigation"
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-[#8491aa] hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="mb-6 flex flex-col items-center gap-3 px-1">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3568ed] text-white shadow-[0_8px_18px_rgba(53,104,237,0.22)]"
              title="DealFlow360 — Deal Intelligence"
            >
              <BarChart3 className="h-5 w-5" />
            </span>
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8491aa] hover:bg-[#f0f3ff] hover:text-[#3568ed] transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-1 custom-scrollbar">
          {sections.map((section, sectionIndex) => (
            <div key={section.title ?? sectionIndex}>
              {section.title && (
                !isCollapsed ? (
                  <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
                    {section.title}
                  </p>
                ) : (
                  <div className="my-3 border-t border-[#f0f3fa] mx-2" />
                )
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    isCollapsed={isCollapsed}
                    onNavigate={() => {
                      if (isMobileOpen) closeMobileSidebar();
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {isCustomer ? (
          <div className={`mt-auto border-t border-[#eef2f9] pt-4 ${isCollapsed ? 'px-0 flex justify-center' : 'px-2'}`}>
            <NavLink
              to="/customer/profile"
              className={`flex items-center rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] transition-all cursor-pointer group hover:bg-[#f0f4ff] hover:border-[#cad7f5]
                ${isCollapsed ? 'p-2 justify-center' : 'gap-3 p-3 shadow-2xs'}
              `}
              title="View & Edit Organization Profile"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#3568ed] to-[#1e40af] text-white font-bold text-xs shadow-sm">
                {userInitials}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-bold text-[#17213a] truncate group-hover:text-[#3568ed] transition-colors"
                    title={userName}
                  >
                    {userName}
                  </p>
                  {isProfileLoading && !companyName ? (
                    <div className="mt-1 h-3 w-20 rounded bg-slate-200 animate-pulse" />
                  ) : companyName ? (
                    <p className="text-[11px] font-medium text-[#64748b] truncate mt-0.5" title={companyName}>
                      {companyName}
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 font-medium truncate mt-0.5">
                      Set Organization Name
                    </p>
                  )}
                  {userEmail && (
                    <p className="text-[10px] text-gray-400 truncate mt-0.5" title={userEmail}>
                      {userEmail}
                    </p>
                  )}
                </div>
              )}
            </NavLink>
          </div>
        ) : (
          /* Workspace Scope Footer for Internal Roles (Sales Rep, Sales Manager, Finance, Admin) */
          <div className={`mt-auto border-t border-[#eef2f9] pt-4 ${isCollapsed ? 'px-0 flex justify-center' : 'px-2'}`}>
            {!isCollapsed ? (
              <div className="rounded-xl bg-[#f7f9fe] border border-[#e4ecfb] p-3 text-xs">
                <div className="flex items-center gap-2">
                  <RoleIcon className="h-4 w-4 text-[#3568ed]" />
                  <p className="font-bold text-[#17213a]">Workspace Scope</p>
                </div>
                <p className="text-[#64748b] mt-1 capitalize font-medium">
                  {activeRole.replace(/_/g, ' ')} Mode
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  {getRoleTitle(activeRole)}
                </p>
              </div>
            ) : (
              <div
                className="relative group flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f9fe] border border-[#e4ecfb] text-[#3568ed] hover:bg-[#eaf0fe] transition-colors cursor-pointer"
                title={`${getRoleTitle(activeRole)} (${activeRole.replace(/_/g, ' ')})`}
              >
                <RoleIcon className="h-4.5 w-4.5" />
                {/* Collapsed Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col z-50 rounded-xl bg-[#17213a] px-3 py-1.5 text-xs text-white shadow-xl whitespace-nowrap pointer-events-none">
                  <span className="font-bold text-white capitalize">{activeRole.replace(/_/g, ' ')} Scope</span>
                  <span className="text-[10px] text-gray-300">{getRoleTitle(activeRole)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  isCollapsed: boolean;
  onNavigate?: () => void;
}

function SidebarLink({ item, isCollapsed, onNavigate }: SidebarLinkProps) {
  const { label, to, icon: Icon } = item;

  // Contextual badges
  let badge: string | null = null;
  if (to === '/quotations') badge = '4';
  if (to === '/pipeline') badge = '5';
  if (to === '/approvals' || to === '/finance/approvals') badge = '2';

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `relative group flex items-center rounded-xl text-sm font-medium transition-all ${
          isCollapsed
            ? 'justify-center h-10 w-full px-0'
            : 'justify-between px-3 py-2.5'
        } ${
          isActive
            ? 'bg-[#3568ed] text-white font-semibold shadow-[0_4px_14px_rgba(53,104,237,0.25)]'
            : 'text-[#59657d] hover:bg-[#f0f3ff] hover:text-[#274fc1]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </div>

          {/* Badge when expanded */}
          {!isCollapsed && badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isActive
                  ? 'bg-white/25 text-white'
                  : 'bg-blue-50 text-[#3568ed]'
              }`}
            >
              {badge}
            </span>
          )}

          {/* Badge when collapsed (floating badge dot/counter) */}
          {isCollapsed && badge && (
            <span
              className={`absolute top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                isActive
                  ? 'bg-white text-[#3568ed]'
                  : 'bg-[#3568ed] text-white shadow-xs'
              }`}
            >
              {badge}
            </span>
          )}

          {/* Collapsed Tooltip on hover */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 z-50 rounded-xl bg-[#17213a] px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
              <span>{label}</span>
              {badge && (
                <span className="rounded-full bg-blue-500/30 px-1.5 py-0.2 text-[10px] text-blue-200">
                  {badge}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}