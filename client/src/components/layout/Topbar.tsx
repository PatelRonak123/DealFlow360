import { Bell, Search, UserRound, ChevronDown } from 'lucide-react';
import { RoleBadge } from '@/components/common/RoleBadge';
import { CURRENT_USER } from '@/config/CurrentUser';

export function Topbar({ notificationCount = 0 }: { notificationCount?: number }) {
  return (
    <header className="flex h-18 items-center justify-between gap-6 border-b border-[#e7ebf7] bg-white px-8 shadow-[0_2px_12px_rgba(61,82,140,0.04)]">
      <div className="flex h-10 w-full max-w-sm items-center gap-3 rounded-xl border border-[#e4e9f7] bg-[#f7f8ff] px-3 text-[#8491aa]">
        <Search className="h-4 w-4" />
        <span className="text-sm">Search anything...</span>
      </div>
      <div className="flex items-center gap-6">
      <button className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f0f3ff]">
        <Bell className="h-5 w-5 text-[#63708a]" />
        {notificationCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {notificationCount}
          </span>
        )}
      </button>

      <RoleBadge role={CURRENT_USER.role} />

      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ff]" aria-label={`${CURRENT_USER.name} profile`}>
          <UserRound className="h-5 w-5 text-[#5271c9]" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-gray-900">{CURRENT_USER.name}</span>
        <ChevronDown className="h-4 w-4 text-[#8491aa]" />
      </div>
      </div>
    </header>
  );
}