import React, { useState } from 'react';
import {
  Award,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAdminCustomerTiers, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { CustomerTier } from '../types/admin.types';

export const AdminCustomerTiersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<CustomerTier | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: tiers = [], isLoading, isError, error } = useAdminCustomerTiers();

  const filteredTiers = tiers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCreateModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (tier: CustomerTier) => {
    setSelectedTier(tier);
    setFormError(null);
    setFormData({
      name: tier.name,
      description: tier.description || '',
      isActive: tier.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formData.name.trim();
    if (!name) {
      setFormError('Tier name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createCustomerTier({
        name,
        description: formData.description?.trim() || null,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.customerTiers() });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create customer tier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;
    setFormError(null);

    const name = formData.name.trim();
    if (!name) {
      setFormError('Tier name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.updateCustomerTier(selectedTier.id, {
        name,
        description: formData.description?.trim() || null,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.customerTiers() });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update customer tier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTier = async (tier: CustomerTier) => {
    if (!window.confirm(`Delete customer tier '${tier.name}'?`)) return;

    try {
      await adminApi.deleteCustomerTier(tier.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.customerTiers() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete customer tier');
    }
  };

  const getTierBadge = (tierName: string) => {
    const lower = tierName.toLowerCase();
    if (lower.includes('gold') || lower.includes('platinum')) return 'gold';
    if (lower.includes('silver')) return 'silver';
    if (lower.includes('bronze')) return 'bronze';
    return 'default';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Award className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Customer Tier Governance
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Manage enterprise account tiers, customer classifications, and discount policy mappings.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Create Customer Tier
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Failed to load customer tiers</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tiers by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#3568ed] bg-white transition"
          />
        </div>
      </Card>

      {/* Tiers Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Loading customer tiers...
          </div>
        ) : filteredTiers.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-gray-500">
            No customer tiers configured.
          </Card>
        ) : (
          filteredTiers.map((tier) => (
            <Card key={tier.id} hoverable className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={getTierBadge(tier.name)} size="md">
                    {tier.name}
                  </Badge>
                  <Badge variant={tier.isActive ? 'success' : 'default'} size="sm">
                    {tier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p className="mt-3 text-xs text-gray-600 line-clamp-3">
                  {tier.description || 'Enterprise customer governance tier for pricing and discount logic.'}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenEditModal(tier)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => handleDeleteTier(tier)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Tier */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Customer Tier"
        description="Add a new customer governance tier for sales pricing rules."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tier Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Diamond VIP Tier"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Eligibility criteria and standard SLA perks..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tierActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="tierActive" className="font-semibold text-gray-700 cursor-pointer">
              Active Tier for Customer Accounts
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
              Create Tier
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Tier */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer Tier"
        description={`Update details for ${selectedTier?.name}.`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tier Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editTierActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="editTierActive" className="font-semibold text-gray-700 cursor-pointer">
              Active Tier
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
