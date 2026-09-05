import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen w-full bg-[#f5f7ff]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pl-64 min-h-screen">
        <Topbar />
        <main className="min-w-0 flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;