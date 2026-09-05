import { UserRole } from '@/types/Auth';

const roleLabels: Record<UserRole, string> = {
  sales_rep: 'Sales Representative',
  sales_manager: 'Sales Manager',
  finance_ops: 'Finance & Ops',
  customer: 'Customer',
  admin: 'Administrator',
};

const roleStyles: Record<UserRole, string> = {
  sales_rep: 'bg-blue-50 text-[#2555d4] border-blue-200',
  sales_manager: 'bg-purple-50 text-purple-700 border-purple-200',
  finance_ops: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  customer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  admin: 'bg-slate-100 text-slate-800 border-slate-300',
};

export function RoleBadge({ role, className = '' }: { role: UserRole; className?: string }) {
  const style = roleStyles[role] || roleStyles.sales_rep;
  const label = roleLabels[role] || role;

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs ${style} ${className}`}
    >
      {label}
    </span>
  );
}