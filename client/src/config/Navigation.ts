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
  User,
  KeyRound,
  FolderTree,
  DollarSign,
  Award,
  Settings,
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

export const adminNavigationSections: NavSection[] = [
  {
    title: undefined,
    items: [
      { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutGrid, roles: [ROLES.ADMIN] },
    ],
  },
  {
    title: 'ACCESS MANAGEMENT',
    items: [
      { label: 'Users', to: '/admin/users', icon: Users, roles: [ROLES.ADMIN] },
      { label: 'Roles', to: '/admin/roles', icon: ShieldCheck, roles: [ROLES.ADMIN] },
      { label: 'Permissions', to: '/admin/permissions', icon: KeyRound, roles: [ROLES.ADMIN] },
    ],
  },
  {
    title: 'BUSINESS CONFIGURATION',
    items: [
      { label: 'Product Categories', to: '/admin/product-categories', icon: FolderTree, roles: [ROLES.ADMIN] },
      { label: 'Products', to: '/admin/products', icon: Package, roles: [ROLES.ADMIN] },
      { label: 'Price Lists', to: '/admin/price-lists', icon: DollarSign, roles: [ROLES.ADMIN] },
      { label: 'Customer Tiers', to: '/admin/customer-tiers', icon: Award, roles: [ROLES.ADMIN] },
      { label: 'Discount Rules', to: '/admin/discount-rules', icon: Percent, roles: [ROLES.ADMIN] },
      { label: 'Warehouses', to: '/admin/warehouses', icon: Warehouse, roles: [ROLES.ADMIN] },
      { label: 'Subscription Plans', to: '/admin/subscription-plans', icon: CalendarClock, roles: [ROLES.ADMIN] },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: Settings, roles: [ROLES.ADMIN] },
    ],
  },
];

export const navigationConfig: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      // Dedicated Role Dashboards
      { label: 'Sales Dashboard', to: '/sales/dashboard', icon: LayoutGrid, roles: [ROLES.SALES_REP] },
      { label: 'Manager Dashboard', to: '/manager/dashboard', icon: LayoutGrid, roles: [ROLES.SALES_MANAGER] },
      { label: 'Finance Dashboard', to: '/finance/dashboard', icon: LayoutGrid, roles: [ROLES.FINANCE] },
      { label: 'Dashboard', to: '/customer/dashboard', icon: LayoutGrid, roles: [ROLES.CUSTOMER] },

      // Sales Operations
      { label: 'Create Quote', to: '/quotations/new', icon: PlusCircle, roles: [ROLES.SALES_MANAGER] },
      { label: 'Quotations', to: '/quotations', icon: FileText, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER] },
      { label: 'Pipeline & Deals', to: '/pipeline', icon: Kanban, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER] },
      { label: 'Customer Accounts', to: '/customers', icon: Users, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER] },
      { label: 'Products Catalog', to: '/products', icon: Package, roles: [ROLES.SALES_REP, ROLES.SALES_MANAGER] },

      // Governance & Approvals
      { label: 'Approvals Queue', to: '/approvals', icon: ClipboardCheck, roles: [ROLES.SALES_MANAGER, ROLES.FINANCE] },

      // Billing, Subscriptions & Fulfillment
      { label: 'Billing & Invoices', to: '/billing', icon: Receipt, roles: [ROLES.FINANCE] },
      { label: 'Subscriptions', to: '/subscriptions', icon: Repeat, roles: [ROLES.FINANCE, ROLES.SALES_MANAGER] },
      { label: 'Fulfillment & Logistics', to: '/fulfillment', icon: Truck, roles: [ROLES.SALES_MANAGER] },
      { label: 'Revenue Analytics', to: '/reports', icon: BarChart2, roles: [ROLES.SALES_MANAGER, ROLES.FINANCE] },

      // Customer Portal Links
      { label: 'Quotations', to: '/customer/quotations', icon: FileText, roles: [ROLES.CUSTOMER] },
      { label: 'Orders', to: '/customer/orders', icon: Truck, roles: [ROLES.CUSTOMER] },
      { label: 'Invoices', to: '/customer/invoices', icon: Receipt, roles: [ROLES.CUSTOMER] },
      { label: 'Payments', to: '/customer/payments', icon: CreditCard, roles: [ROLES.CUSTOMER] },
      { label: 'Profile', to: '/customer/profile', icon: User, roles: [ROLES.CUSTOMER] },
    ],
  },
];

export function getNavForRole(role: UserRole | string): NavSection[] {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === ROLES.ADMIN) {
    return adminNavigationSections;
  }

  return navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const itemRoles = item.roles.map(normalizeRole);
        return itemRoles.includes(normalizedRole);
      }),
    }))
    .filter((section) => section.items.length > 0);
}