import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { LuLogOut, LuShield, LuUser, LuWorkflow } from 'react-icons/lu';
import toast from 'react-hot-toast';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F8FC] text-[#172033]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#DCE4F0] bg-white/95 px-6 py-3.5 backdrop-blur sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3165E8] text-white shadow-md shadow-[#3165E8]/20">
            <LuWorkflow size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#172033]">DealFlow360</h1>
            <span className="text-xs font-semibold text-[#647592]">Enterprise Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden items-center gap-3 rounded-xl border border-[#DCE4F0] bg-[#F8FAFD] px-3.5 py-1.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3165E8]/10 text-[#3165E8]">
                <LuUser size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#172033] leading-none">{user.name}</p>
                <p className="mt-0.5 text-[11px] text-[#647592] leading-none">{user.email}</p>
              </div>
              {user.roles && user.roles.length > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-[#3165E8]/10 px-2 py-0.5 text-[11px] font-semibold text-[#3165E8]">
                  <LuShield size={12} />
                  {user.roles[0].replace('_', ' ')}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#475569] shadow-sm transition hover:bg-[#F8FAFC] hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <LuLogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-10 lg:px-14">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
