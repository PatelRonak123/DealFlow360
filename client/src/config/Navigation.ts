import {
  LayoutGrid, FileText, Kanban, Users, Package, ClipboardCheck,
  Boxes, Receipt, Repeat, Percent, Warehouse, CalendarClock,
  BarChart2, ShieldCheck, LucideIcon,
} from 'lucide-react';
import { UserRole } from '@/types/Auth';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid, roles: ['sales_rep', 'sales_manager', 'finance_ops', 'customer', 'admin'] },
      { label: 'Quotations', to: '/quotations', icon: FileText, roles: ['sales_rep', 'sales_manager', 'customer'] },
      { label: 'Pipeline', to: '/pipeline', icon: Kanban, roles: ['sales_rep', 'sales_manager'] },
      { label: 'Customers', to: '/customers', icon: Users, roles: ['sales_rep', 'sales_manager', 'admin'] },
      { label: 'Products', to: '/products', icon: Package, roles: ['sales_rep', 'sales_manager', 'admin'] },
      { label: 'Approvals', to: '/approvals', icon: ClipboardCheck, roles: ['sales_manager', 'finance_ops'] },
      { label: 'Fulfillment', to: '/fulfillment', icon: Boxes, roles: ['sales_manager', 'finance_ops'] },
      { label: 'Billing & Invoices', to: '/billing', icon: Receipt, roles: ['finance_ops', 'customer'] },
      { label: 'Subscriptions', to: '/subscriptions', icon: Repeat, roles: ['finance_ops', 'sales_manager'] },
      { label: 'Reports', to: '/reports', icon: BarChart2, roles: ['sales_manager', 'finance_ops', 'admin'] },
      { label: 'User Management', to: '/admin/users', icon: ShieldCheck, roles: ['admin'] },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Products', to: '/config/products', icon: Package, roles: ['admin'] },
      { label: 'Discount Rules', to: '/config/discount-rules', icon: Percent, roles: ['admin'] },
      { label: 'Warehouses', to: '/config/warehouses', icon: Warehouse, roles: ['admin'] },
      { label: 'Subscription Plans', to: '/config/subscription-plans', icon: CalendarClock, roles: ['admin'] },
    ],
  },
];

export function getNavForRole(role: UserRole): NavSection[] {
  return navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}