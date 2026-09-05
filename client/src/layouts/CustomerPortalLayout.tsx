import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Boxes,
  Receipt,
  CreditCard,
  Repeat,
  Bell,
  LogOut,
  User,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useCustomerProfile } from '@/features/customer-portal/hooks/useCustomerProfile';

export const CustomerPortalLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: customerProfile } = useCustomerProfile();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'Overview', to: '/customer/dashboard', icon: LayoutGrid },
    { label: 'Quotations', to: '/customer/quotations', icon: FileText },
    { label: 'Orders', to: '/customer/orders', icon: Boxes },
    { label: 'Invoices', to: '/customer/invoices', icon: Receipt },
    { label: 'Payments', to: '/customer/payments', icon: CreditCard },
    { label: 'Subscriptions', to: '/customer/subscriptions', icon: Repeat },
    { label: 'Profile', to: '/customer/profile', icon: User },
  ];

  const companyName =
    customerProfile?.companyName || user?.customer?.companyName || 'Enterprise Customer Portal';
  const contactName =
    customerProfile?.contactName || user?.name || 'Customer Representative';

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col font-sans text-[#17213a]">
      {/* Top Customer Portal Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#e2e8f5] bg-white/95 backdrop-blur shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand Logo & Portal Tag */}
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6] text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-[#0f172a]">
                    DealFlow360
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2563eb] border border-blue-100">
                    Customer Portal
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#64748b] leading-tight">
                  {companyName}
                </p>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#eff6ff] text-[#2563eb] font-bold shadow-2xs'
                          : 'text-[#64748b] hover:bg-slate-50 hover:text-[#0f172a]'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Action Bar */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <NavLink
                to="/customer/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-[#64748b] hover:bg-slate-50 transition"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-2xs">
                  2
                </span>
              </NavLink>

              {/* User Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                    {contactName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-[#0f172a] leading-tight truncate max-w-[120px]">
                      {contactName}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">Customer Access</p>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-[#0f172a]">{contactName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <NavLink
                      to="/customer/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      Customer Profile & Addresses
                    </NavLink>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center overflow-x-auto border-t border-slate-100 px-4 py-2 gap-2 bg-slate-50/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Main Customer Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerPortalLayout;
