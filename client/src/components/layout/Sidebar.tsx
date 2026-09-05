import { NavLink } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { getNavForRole, NavItem } from '@/config/Navigation';
import { CURRENT_USER } from '@/config/CurrentUser';

export function Sidebar() {
  const sections = getNavForRole(CURRENT_USER.role);

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#e7ebf7] bg-white px-4 py-5">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3568ed] text-white shadow-[0_8px_18px_rgba(53,104,237,0.22)]">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-bold tracking-tight text-[#17213a]">DealFlow360</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8491aa]">Deal intelligence</p>
        </div>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.title ?? sectionIndex}>
            {section.title && (
              <p className="mb-3 mt-7 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function SidebarLink({ label, to, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#3568ed] text-white shadow-[0_8px_18px_rgba(53,104,237,0.22)]'
            : 'text-[#59657d] hover:bg-[#f0f3ff] hover:text-[#274fc1]'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}