import { UserRole } from '@/types/Auth';
import { normalizeRole, ROLES } from '@/lib/accessControl';
const roleLabels: Record<string, string> = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.SALES_REP]: 'Sales Representative',
  [ROLES.SALES_MANAGER]: 'Sales Manager',
  [ROLES.FINANCE]: 'Finance',
  [ROLES.CUSTOMER]: 'Customer',
};

const roleStyles: Record<string, string> = {
  [ROLES.ADMIN]: 'bg-slate-100 text-slate-800 border-slate-300',
  [ROLES.SALES_REP]: 'bg-blue-50 text-[#2555d4] border-blue-200',
  [ROLES.SALES_MANAGER]: 'bg-purple-50 text-purple-700 border-purple-200',
  [ROLES.FINANCE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ROLES.CUSTOMER]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export function RoleBadge({ role, className = '' }: { role: UserRole | string; className?: string }) {
  const norm = normalizeRole(role);
  const style = roleStyles[norm] || roleStyles[ROLES.SALES_REP];
  const label = roleLabels[norm] || norm;

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs ${style} ${className}`}
    >
      {label}
    </span>
  );
}

export default RoleBadge;