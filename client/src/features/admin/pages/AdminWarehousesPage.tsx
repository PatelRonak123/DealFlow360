import React, { useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAdminWarehouses, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { Warehouse } from '../types/admin.types';

export const AdminWarehousesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    priority: 1,
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query
  const { data: warehouses = [], isLoading, isError, error, refetch } = useAdminWarehouses();

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      (w.city && w.city.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCreateModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      priority: 1,
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (wh: Warehouse) => {
    setSelectedWarehouse(wh);
    setFormError(null);
    setFormData({
      name: wh.name,
      code: wh.code,
      address: wh.address || '',
      city: wh.city || '',
      state: wh.state || '',
      country: wh.country || 'India',
      pincode: wh.pincode || '',
      priority: wh.priority || 1,
      isActive: wh.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();

    if (!name) {
      setFormError('Warehouse name is required');
      return;
    }
    if (!code) {
      setFormError('Warehouse code is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createWarehouse({
        name,
        code,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        country: formData.country?.trim() || 'India',
        pincode: formData.pincode?.trim() || null,
        priority: Number(formData.priority) || 1,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.warehouses() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    setFormError(null);

    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();

    if (!name) {
      setFormError('Warehouse name is required');
      return;
    }
    if (!code) {
      setFormError('Warehouse code is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.updateWarehouse(selectedWarehouse.id, {
        name,
        code,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        country: formData.country?.trim() || 'India',
        pincode: formData.pincode?.trim() || null,
        priority: Number(formData.priority) || 1,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.warehouses() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (wh: Warehouse) => {
    const newStatus = !wh.isActive;
    const confirmMsg = newStatus
      ? `Activate warehouse '${wh.name}'?`
      : `Deactivate warehouse '${wh.name}'? Order fulfillment allocation will bypass this node.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.updateWarehouse(wh.id, { isActive: newStatus });
      await queryClient.invalidateQueries({ queryKey: adminKeys.warehouses() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to update warehouse status');
    }
  };

  const handleDeleteWarehouse = async (wh: Warehouse) => {
    if (!window.confirm(`Delete warehouse '${wh.name}' (${wh.code})?`)) return;

    try {
      await adminApi.deleteWarehouse(wh.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.warehouses() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete warehouse');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <WarehouseIcon className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Warehouse &amp; Logistics Hubs
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Configure regional fulfillment centers, dispatch priority rankings, and facility addresses.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Add Warehouse Hub
        </Button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, code, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#59657d]">
          <span>
            Configured Warehouses: <strong className="text-[#17213a]">{warehouses.length}</strong>
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
            <h4 className="font-bold text-rose-900">Failed to load warehouses</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Warehouses Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Loading warehouses...
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-gray-500">
            No warehouses found matching &quot;{search}&quot;.
          </Card>
        ) : (
          filteredWarehouses.map((wh) => (
            <Card key={wh.id} hoverable className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <WarehouseIcon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#17213a]">{wh.name}</h3>
                      <p className="text-[10px] font-mono text-gray-400 font-bold">{wh.code}</p>
                    </div>
                  </div>
                  <Badge variant={wh.isActive ? 'success' : 'default'} size="sm">
                    {wh.isActive ? 'Operational' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {wh.address ? `${wh.address}, ` : ''}
                      {[wh.city, wh.state, wh.pincode].filter(Boolean).join(', ') || wh.country}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 p-2.5 text-xs border border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> Dispatch Priority
                  </span>
                  <span className="font-bold text-purple-700">Level {wh.priority}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenEditModal(wh)}
                >
                  Edit Hub
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={wh.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                    onClick={() => handleToggleStatus(wh)}
                  >
                    {wh.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => handleDeleteWarehouse(wh)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Warehouse */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Warehouse Logistics Hub"
        description="Configure a new distribution node for operations inventory allocation."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Warehouse Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Bangalore Primary Fulfillment Center"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Code (Unique)</label>
              <input
                type="text"
                required
                placeholder="e.g. BLR-HUB-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              placeholder="Plot 42, Electronic City Phase 1"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">City</label>
              <input
                type="text"
                placeholder="Bengaluru"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">State</label>
              <input
                type="text"
                placeholder="Karnataka"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">PIN Code</label>
              <input
                type="text"
                placeholder="560100"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Dispatch Priority <span className="text-gray-400 font-normal">(Higher = First allocated)</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="whActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="whActive" className="font-semibold text-gray-700 cursor-pointer">
              Facility Operational for Order Allocation
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
              Add Warehouse
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Warehouse */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Warehouse Hub"
        description={`Update settings for ${selectedWarehouse?.name}.`}
        maxWidth="xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Warehouse Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">PIN Code</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Dispatch Priority</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editWhActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="editWhActive" className="font-semibold text-gray-700 cursor-pointer">
              Operational
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
