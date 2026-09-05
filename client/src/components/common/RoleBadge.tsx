import { UserRole } from '@/types/Auth';

const roleLabels: Record<UserRole, string> = {
  sales_rep: 'Sales Rep',
  sales_manager: 'Sales Manager',
  finance_ops: 'Finance/Ops',
  customer: 'Customer',
  admin: 'Admin',
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700">
      {roleLabels[role]}
    </div>
  );
}