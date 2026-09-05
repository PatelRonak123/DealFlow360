import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f7ff]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;