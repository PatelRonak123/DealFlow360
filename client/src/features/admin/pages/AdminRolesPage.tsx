import React, { useState } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Edit2,
  Trash2,
  Users,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAdminRoles, useAdminPermissions, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { AdminRole, GroupedPermission } from '../types/admin.types';

export const AdminRolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: roles = [], isLoading, isError, error } = useAdminRoles();
  const { data: permissionsData } = useAdminPermissions();

  const groupedPermissions: GroupedPermission[] = permissionsData?.grouped || [];

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreateModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      description: '',
      permissionIds: [],
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (role: AdminRole) => {
    setSelectedRole(role);
    setFormError(null);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map((p) => p.id),
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formData.name.trim().toUpperCase();
    if (!cleanName) {
      setFormError('Role name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createRole({
        name: cleanName,
        description: formData.description?.trim() || null,
        permissionIds: formData.permissionIds,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.roles() });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setFormError(null);

    try {
      setIsSubmitting(true);
      await adminApi.updateRole(selectedRole.id, {
        description: formData.description?.trim() || null,
        permissionIds: formData.permissionIds,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.roles() });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update role permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: AdminRole) => {
    if (role.isSystemRole) {
      alert(`System role '${role.name}' is core to the platform and cannot be deleted.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the custom role '${role.name}'?`)) {
      return;
    }

    try {
      await adminApi.deleteRole(role.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.roles() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete role');
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    setFormData((prev) => {
      const exists = prev.permissionIds.includes(permissionId);
      if (exists) {
        return { ...prev, permissionIds: prev.permissionIds.filter((id) => id !== permissionId) };
      } else {
        return { ...prev, permissionIds: [...prev.permissionIds, permissionId] };
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              RBAC Role Configurations
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Configure role access policies, permission sets, and system authorization scopes.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Create Custom Role
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Failed to load roles</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Loading roles and permission mappings...
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} hoverable className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#17213a]">{role.name}</h3>
                      {role.isSystemRole ? (
                        <Badge variant="default" size="sm">
                          System Role
                        </Badge>
                      ) : (
                        <Badge variant="negotiating" size="sm">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {role.description || 'Custom organizational authorization role'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs">
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>Assigned Users</span>
                    </div>
                    <p className="mt-1 text-base font-bold text-[#17213a]">
                      {role.assignedUsersCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Permissions</span>
                    </div>
                    <p className="mt-1 text-base font-bold text-[#17213a]">
                      {role.permissions.length}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Active Permissions Sample
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {role.permissions.slice(0, 6).map((p) => (
                      <span
                        key={p.id}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 font-medium"
                      >
                        {p.name}
                      </span>
                    ))}
                    {role.permissions.length > 6 && (
                      <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 font-bold">
                        +{role.permissions.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenEditModal(role)}
                >
                  Configure Permissions
                </Button>

                {!role.isSystemRole && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => handleDeleteRole(role)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Role */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Custom Role"
        description="Define a new role and choose allowable capabilities across domain modules."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Role Identifier (Uppercase)</label>
            <input
              type="text"
              required
              placeholder="e.g. OPERATIONS_AUDITOR"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of this role's business duties..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Assign Permissions Matrix</label>
            <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              {groupedPermissions.map((group) => (
                <div key={group.domain} className="rounded-lg bg-white p-2.5 border border-gray-100 shadow-2xs">
                  <p className="font-bold text-[#17213a] uppercase text-[11px] tracking-wider mb-2 text-purple-700">
                    {group.domain} Module
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.items.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissionIds.includes(perm.id)}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
                        />
                        <span className="font-mono text-[11px] text-gray-700">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Role Permissions */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Configure Permissions — ${selectedRole?.name}`}
        description="Select or revoke granular capabilities granted to users with this role."
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-semibold text-gray-700">Capabilities Matrix</label>
              <span className="text-[11px] text-purple-700 font-bold">
                {formData.permissionIds.length} Selected
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              {groupedPermissions.map((group) => (
                <div key={group.domain} className="rounded-lg bg-white p-2.5 border border-gray-100 shadow-2xs">
                  <p className="font-bold text-[#17213a] uppercase text-[11px] tracking-wider mb-2 text-purple-700">
                    {group.domain}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.items.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 p-1 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissionIds.includes(perm.id)}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
                        />
                        <span className="font-mono text-[11px] text-gray-700">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Capabilities
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
