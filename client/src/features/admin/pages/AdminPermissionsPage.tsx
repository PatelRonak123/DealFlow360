import React, { useState } from 'react';
import {
  KeyRound,
  Search,
  Layers,
  RefreshCw,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAdminPermissions } from '../hooks/useAdmin';
import { GroupedPermission, AdminPermission } from '../types/admin.types';

export const AdminPermissionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: permsData, isLoading, isError, error, refetch } = useAdminPermissions();

  const grouped: GroupedPermission[] = permsData?.grouped || [];
  const flat: AdminPermission[] = permsData?.flat || [];

  // Filter grouped items based on search query
  const filteredGroups = grouped
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <KeyRound className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Platform Permissions Registry
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Inspect system-level capability tokens and authorization scopes enforced by backend middleware.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search permissions by name or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#59657d]">
          <span>
            Registered Permissions: <strong className="text-[#17213a]">{flat.length}</strong> across{' '}
            <strong className="text-[#17213a]">{grouped.length}</strong> domains
          </span>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Failed to load permissions</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Grouped Permission Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-400">
          Loading platform capability registry...
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No permissions matched &quot;{search}&quot;.
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredGroups.map((group) => (
            <Card key={group.domain} className="p-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Layers className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-sm font-bold text-[#17213a] uppercase tracking-wider">
                    {group.domain} Module
                  </h3>
                </div>
                <Badge variant="default" size="sm">
                  {group.items.length} Scopes
                </Badge>
              </div>

              <div className="space-y-2">
                {group.items.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-start justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-gray-200 transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="font-mono font-semibold text-xs text-[#17213a]">
                          {perm.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {perm.description || `Enforces authorization for ${perm.name}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
