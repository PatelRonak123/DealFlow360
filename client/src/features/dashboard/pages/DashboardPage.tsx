import { CURRENT_USER } from '@/config/CurrentUser';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/Auth';
import { ArrowDown, ArrowUp, Clock3, FileText, IndianRupee, Tag } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const rawRole = user?.roles?.[0]?.toLowerCase();
  const role: UserRole =
    rawRole === 'sales_representative' || rawRole === 'sales_rep'
      ? 'sales_rep'
      : (rawRole as UserRole) || CURRENT_USER.role;

  const name = user?.name || CURRENT_USER.name;

  return <RoleDashboard role={role} name={name} />;
}

const roleLabels: Record<string, string> = {
  sales_rep: 'Sales Representative',
  sales_manager: 'Sales Manager',
  finance_ops: 'Finance and Operations',
  customer: 'Customer',
  admin: 'Administrator',
};

const metrics = [
  { label: 'Total Quotations', value: '24', change: '12% from last week', icon: FileText, tone: 'blue', trend: 'up' },
  { label: 'Pipeline Value', value: '₹ 12.45 L', change: '8% from last week', icon: IndianRupee, tone: 'green', trend: 'up' },
  { label: 'Pending Approvals', value: '7', change: '2 from last week', icon: Clock3, tone: 'purple', trend: 'down' },
  { label: 'Avg. Discount', value: '18.6%', change: '3% from last week', icon: Tag, tone: 'orange', trend: 'up' },
];

const quotationRows = [
  ['Q-1024', 'Acme Corporation', '₹ 2,45,000', 'Approval'],
  ['Q-1023', 'Beta Solutions Pvt. Ltd.', '₹ 1,80,500', 'Approved'],
  ['Q-1022', 'Nova Systems', '₹ 4,20,000', 'Draft'],
  ['Q-1021', 'TechWorld Enterprises', '₹ 3,10,000', 'Rejected'],
];

function RoleDashboard({ role, name }: { role: string; name: string }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[#71809f]">Welcome back, {name}!</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17213a]">
          {roleLabels[role] || 'Enterprise'} Dashboard
        </h1>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, change, icon: Icon, tone, trend }) => (
          <div key={label} className="rounded-2xl border border-[#e7ebf7] bg-white p-5 shadow-[0_8px_24px_rgba(64,86,145,0.07)]">
            <div className="flex items-start justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${metricTone[tone].background}`}>
                <Icon className={`h-5 w-5 ${metricTone[tone].icon}`} />
              </span>
              <span className="text-2xl font-semibold text-[#17213a]">{value}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-[#59657d]">{label}</p>
            <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend === 'down' ? 'text-[#f06b6b]' : 'text-[#38a878]'}`}>
              {trend === 'down' ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
              {change}
            </p>
          </div>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-6 shadow-[0_8px_24px_rgba(64,86,145,0.05)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-[#17213a]">Deal Health</h2>
            <button className="text-xs font-semibold text-[#3568ed]">View all</button>
          </div>
          <div className="space-y-1">
            {[
              ['3 Stalled Deals', 'Quotes inactive for more than 7 days', 'text-[#ee6c6c]'],
              ['2 Discount Anomalies', 'Higher than usual discount applied', 'text-[#e9a04b]'],
              ['1 Delivery Risk', 'Possible delay in expected delivery', 'text-[#e9b04b]'],
              ['5 Deals in Negotiation', 'Waiting for customer response', 'text-[#38a878]'],
            ].map(([title, description, color]) => (
              <div key={title} className="flex items-center justify-between border-b border-[#eef1f8] py-3 last:border-0">
                <div><p className={`text-sm font-semibold ${color}`}>{title}</p><p className="mt-1 text-xs text-[#8491aa]">{description}</p></div>
                <span className="text-[#a3aec1]">›</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e7ebf7] bg-white p-6 shadow-[0_8px_24px_rgba(64,86,145,0.05)]">
          <div className="mb-5 flex items-center justify-between"><h2 className="font-semibold text-[#17213a]">Recent Quotations</h2><button className="text-xs font-semibold text-[#3568ed]">View all</button></div>
          <div className="space-y-1">
            {quotationRows.map(([id, customer, amount, status]) => (
              <div key={id} className="flex items-center justify-between border-b border-[#eef1f8] py-3 last:border-0">
                <div><p className="text-sm font-semibold text-[#3568ed]">{id}</p><p className="mt-1 text-xs text-[#8491aa]">{customer}</p></div>
                <div className="text-right"><p className="text-sm font-semibold text-[#17213a]">{amount}</p><span className="text-[11px] font-medium text-[#38a878]">{status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const metricTone: Record<string, { background: string; icon: string }> = {
  blue: { background: 'bg-[#edf4ff]', icon: 'text-[#4d8df7]' },
  green: { background: 'bg-[#eaf9f1]', icon: 'text-[#35ad79]' },
  purple: { background: 'bg-[#f1edff]', icon: 'text-[#9474e8]' },
  orange: { background: 'bg-[#fff3e8]', icon: 'text-[#f29a4a]' },
};