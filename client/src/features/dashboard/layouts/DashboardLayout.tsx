import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useSidebar } from '@/context/SidebarContext';

export function DashboardLayout() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen w-full bg-[#f5f7ff]">
      <Sidebar />
      <div
        className={`flex min-w-0 flex-1 flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Topbar />
        <main className="min-w-0 flex-1 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;