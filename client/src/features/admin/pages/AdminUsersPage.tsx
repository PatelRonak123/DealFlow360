import React, { useState } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  UserCheck,
  UserX,
  Edit2,
  RefreshCw,
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/features/auth';
import { useAdminUsers, useAdminRoles, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { AdminUser } from '../types/admin.types';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleIds: [] as string[],
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: usersData, isLoading, isError, error, refetch } = useAdminUsers({
    page,
    limit,
    search: search.trim() || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
  });

  const { data: roles = [] } = useAdminRoles();

  const usersList = usersData?.items || [];
  const total = usersData?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Handlers
  const handleOpenCreateModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      roleIds: roles.length > 0 ? [roles[0].id] : [],
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (targetUser: AdminUser) => {
    setSelectedUser(targetUser);
    setFormError(null);
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: '',
      roleIds: targetUser.roles.map((r) => r.id),
      isActive: targetUser.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    if (formData.roleIds.length === 0) {
      setFormError('At least one role must be assigned');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        roleIds: formData.roleIds,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (formData.roleIds.length === 0) {
      setFormError('At least one role must be assigned');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.updateUser(selectedUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        ...(formData.password ? { password: formData.password } : {}),
        roleIds: formData.roleIds,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser: AdminUser) => {
    const newStatus = !targetUser.isActive;
    const confirmMsg = newStatus
      ? `Activate user account for ${targetUser.name}?`
      : `Deactivate user account for ${targetUser.name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.updateUserStatus(targetUser.id, newStatus);
      await queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to update user status');
    }
  };

  const handleRoleCheckboxChange = (roleId: string) => {
    setFormData((prev) => {
      const exists = prev.roleIds.includes(roleId);
      if (exists) {
        return { ...prev, roleIds: prev.roleIds.filter((id) => id !== roleId) };
      } else {
        return { ...prev, roleIds: [...prev.roleIds, roleId] };
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
              <Users className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              User Accounts Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            View enterprise accounts, assign RBAC roles, and control active credentials.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Create User Account
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#59657d]">
          <span>
            Total Users: <strong className="text-[#17213a]">{total}</strong>
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Failed to load user accounts</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-[#f8faff] text-[#59657d] font-semibold">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Roles</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#17213a]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading user accounts...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                usersList.map((targetUser) => {
                  const isSelf = targetUser.id === currentUser?.id;
                  return (
                    <tr key={targetUser.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#3568ed] font-bold text-xs">
                          {targetUser.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <span>{targetUser.name}</span>
                          {isSelf && (
                            <span className="ml-2 inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{targetUser.email}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {targetUser.roles.map((r) => (
                            <span
                              key={r.id}
                              className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                                r.name === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-800'
                                  : r.name === 'SALES_MANAGER'
                                  ? 'bg-amber-100 text-amber-800'
                                  : r.name === 'FINANCE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {r.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={targetUser.isActive ? 'success' : 'default'} size="sm">
                          {targetUser.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(targetUser.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                            onClick={() => handleOpenEditModal(targetUser)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={targetUser.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}
                            leftIcon={
                              targetUser.isActive ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )
                            }
                            onClick={() => handleToggleStatus(targetUser)}
                          >
                            {targetUser.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={10}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </Card>

      {/* Modal: Create User */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create User Account"
        description="Add a new team member and assign enterprise platform roles."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="e.g. Anand Mahindra"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Initial Password</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Assign Platform Roles</label>
            <div className="grid grid-cols-2 gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              {roles.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(r.id)}
                    onChange={() => handleRoleCheckboxChange(r.id)}
                    className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
                  />
                  <div>
                    <p className="font-semibold text-[#17213a]">{r.name}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{r.description || 'Standard role'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="isActive" className="font-semibold text-gray-700 cursor-pointer">
              Account Active Immediately
            </label>
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
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Account"
        description={`Update credentials and roles for ${selectedUser?.name}.`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Reset Password <span className="text-gray-400 font-normal">(Leave blank to keep existing)</span>
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <input
                type="password"
                placeholder="New password (optional)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">Assigned Roles</label>
            <div className="grid grid-cols-2 gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              {roles.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(r.id)}
                    onChange={() => handleRoleCheckboxChange(r.id)}
                    className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
                  />
                  <div>
                    <p className="font-semibold text-[#17213a]">{r.name}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{r.description || 'Standard role'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="editIsActive" className="font-semibold text-gray-700 cursor-pointer">
              Account Active
            </label>
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
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
