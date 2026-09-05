import {
  LayoutGrid,
  FileText,
  Kanban,
  Users,
  Package,
  ClipboardCheck,
  Receipt,
  Repeat,
  Percent,
  Warehouse,
  CalendarClock,
  BarChart2,
  ShieldCheck,
  CreditCard,
  LucideIcon,
  PlusCircle,
  Truck,
} from 'lucide-react';
import { UserRole } from '@/types/Auth';
import { normalizeRole, ROLES } from '@/lib/accessControl';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: (UserRole | string)[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      // Dedicated Role Dashboards
      { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutGrid, roles: [ROLES.ADMIN] },
      { label: 'Sales Dashboard', to: '/sales/dashboard', icon: LayoutGrid, roles: [ROLES.SALES_REP] },
      { label: 'Manager Dashboard', to: '/manager/dashboard', icon: LayoutGrid, roles: [ROLES.SALES_MANAGER] },
      { label: 'Finance Dashboard', to: '/finance/dashboard', icon: LayoutGrid, roles: [ROLES.FINANCE] },
      { label: 'Dashboard', to: '/customer/dashboard', icon: LayoutGrid, roles: [ROLES.CUSTOMER] },

      // Sales Operations
      { label: 'Create Quote', to: '/quotations/new', icon: PlusCircle, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER] },
      { label: 'Quotations', to: '/quotations', icon: FileText, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN] },
      { label: 'Pipeline & Deals', to: '/pipeline', icon: Kanban, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER] },
      { label: 'Customer Accounts', to: '/customers', icon: Users, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN] },
      { label: 'Products Catalog', to: '/products', icon: Package, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER, ROLES.ADMIN] },

      // Governance & Approvals
      { label: 'Approvals Queue', to: '/approvals', icon: ClipboardCheck, roles: [ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN] },

      // Billing, Subscriptions & Fulfillment
      { label: 'Billing & Invoices', to: '/billing', icon: Receipt, roles: [ROLES.FINANCE, ROLES.ADMIN] },
      { label: 'Subscriptions', to: '/subscriptions', icon: Repeat, roles: [ROLES.FINANCE, ROLES.SALES_MANAGER, ROLES.ADMIN] },
      { label: 'Fulfillment & Logistics', to: '/fulfillment', icon: Truck, roles: [ROLES.SALES_MANAGER, ROLES.ADMIN] },
      { label: 'Revenue Analytics', to: '/reports', icon: BarChart2, roles: [ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN] },

      // Customer Portal Links
      { label: 'Quotations', to: '/customer/quotations', icon: FileText, roles: [ROLES.CUSTOMER] },
      { label: 'Orders', to: '/customer/orders', icon: Truck, roles: [ROLES.CUSTOMER] },
      { label: 'Invoices', to: '/customer/invoices', icon: Receipt, roles: [ROLES.CUSTOMER] },
      { label: 'Payments', to: '/customer/payments', icon: CreditCard, roles: [ROLES.CUSTOMER] },

      // Admin Management
      { label: 'User Management', to: '/admin/users', icon: ShieldCheck, roles: [ROLES.ADMIN] },
    ],
  },
  {
    title: 'Governance & Rules',
    items: [
      { label: 'Product Catalog Books', to: '/config/products', icon: Package, roles: [ROLES.ADMIN] },
      { label: 'Discount Governance Rules', to: '/config/discount-rules', icon: Percent, roles: [ROLES.ADMIN] },
      { label: 'Warehouses & Hubs', to: '/config/warehouses', icon: Warehouse, roles: [ROLES.ADMIN] },
      { label: 'Subscription Plans', to: '/config/subscription-plans', icon: CalendarClock, roles: [ROLES.ADMIN] },
    ],
  },
];

export function getNavForRole(role: UserRole | string): NavSection[] {
  const normalizedRole = normalizeRole(role);

  return navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const itemRoles = item.roles.map(normalizeRole);
        return itemRoles.includes(normalizedRole) || (normalizedRole === ROLES.ADMIN && !itemRoles.includes(ROLES.CUSTOMER));
      }),
    }))
    .filter((section) => section.items.length > 0);
}