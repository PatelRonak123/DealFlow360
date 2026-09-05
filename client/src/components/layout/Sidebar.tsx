import { NavLink } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { getNavForRole, NavItem } from '@/config/Navigation';
<<<<<<< Updated upstream
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/Auth';

export function Sidebar() {
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

  const sections = getNavForRole(role);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#e7ebf7] bg-white px-4 py-5 select-none">
=======
import { CURRENT_USER, normalizeRole } from '@/config/CurrentUser';
import { useAuth } from '@/features/auth';

export function Sidebar() {
  const { user } = useAuth();
  const role = normalizeRole(user?.roles?.[0] || CURRENT_USER.role);
  const sections = getNavForRole(role);

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[#e7ebf7] bg-white px-4 py-5">
>>>>>>> Stashed changes
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3568ed] text-white shadow-[0_8px_18px_rgba(53,104,237,0.22)]">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-bold tracking-tight text-[#17213a]">DealFlow360</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8491aa]">Deal intelligence</p>
        </div>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-1">
        {sections.map((section, sectionIndex) => (
          <div key={section.title ?? sectionIndex}>
            {section.title && (
              <p className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>
            )}
<<<<<<< Updated upstream
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </div>
=======
            {section.items.map((item) => (
              <SidebarLink
                key={item.to}
                {...item}
                badge={item.label === 'Approvals' && role === 'sales_manager' ? 5 : undefined}
              />
            ))}
>>>>>>> Stashed changes
          </div>
        ))}
      </nav>

      {/* Role Indicator Footer */}
      <div className="mt-auto border-t border-[#eef2f9] pt-4 px-2">
        <div className="rounded-xl bg-[#f7f9fe] border border-[#e4ecfb] p-3 text-xs">
          <p className="font-bold text-[#17213a]">Workspace Scope</p>
          <p className="text-[#64748b] mt-0.5 capitalize">
            {(user?.role || role).replace('_', ' ')} Mode
          </p>
        </div>
      </div>
    </aside>
  );
}

<<<<<<< Updated upstream
function SidebarLink({ item }: { item: NavItem }) {
  const { label, to, icon: Icon } = item;

  // Contextual badges
  let badge: string | null = null;
  if (to === '/quotations') badge = '4';
  if (to === '/pipeline') badge = '5';
  if (to === '/approvals') badge = '2';

=======
function SidebarLink({ label, to, icon: Icon, badge }: NavItem & { badge?: number }) {
>>>>>>> Stashed changes
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
<<<<<<< Updated upstream
        `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
          ? 'bg-[#3568ed] text-white font-semibold shadow-[0_4px_14px_rgba(53,104,237,0.25)]'
          : 'text-[#59657d] hover:bg-[#f0f3ff] hover:text-[#274fc1]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{label}</span>
          </div>
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive
                  ? 'bg-white/25 text-white'
                  : 'bg-blue-50 text-[#3568ed]'
                }`}
            >
              {badge}
            </span>
          )}
        </>
=======
        `flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#3568ed] text-white shadow-[0_8px_18px_rgba(53,104,237,0.22)]'
            : 'text-[#59657d] hover:bg-[#f0f3ff] hover:text-[#274fc1]'
        }`
      }
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
          {badge}
        </span>
>>>>>>> Stashed changes
      )}
    </NavLink>
  );
}