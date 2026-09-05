import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export function AppLayout() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pl-64 min-h-screen">
        <Topbar />
        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}