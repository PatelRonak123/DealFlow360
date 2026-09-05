import React, { useState } from 'react';
import {
  CalendarClock,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAdminSubscriptionPlans, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { SubscriptionPlan } from '../types/admin.types';

export const AdminSubscriptionPlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    billingInterval: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    price: '',
    currency: 'INR',
    featuresRaw: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query
  const { data: plans = [], isLoading, isError, error, refetch } = useAdminSubscriptionPlans();

  const filteredPlans = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      billingInterval: 'MONTHLY',
      price: '',
      currency: 'INR',
      featuresRaw: 'Deal Intelligence Engine\nAutomated Quotation Approvals\nDedicated Account Support',
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormError(null);
    setFormData({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      billingInterval: plan.billingInterval,
      price: plan.price,
      currency: plan.currency || 'INR',
      featuresRaw: (plan.features || []).join('\n'),
      isActive: plan.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();

    if (!name) {
      setFormError('Plan name is required');
      return;
    }
    if (!code) {
      setFormError('Plan code is required');
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      setFormError('Valid price is required');
      return;
    }

    const features = formData.featuresRaw
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);
      await adminApi.createSubscriptionPlan({
        name,
        code,
        description: formData.description?.trim() || null,
        billingInterval: formData.billingInterval,
        price: parseFloat(formData.price).toFixed(2),
        currency: formData.currency,
        features,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.subscriptionPlans() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setFormError(null);

    const name = formData.name.trim();
    const code = formData.code.trim().toUpperCase();

    if (!name) {
      setFormError('Plan name is required');
      return;
    }
    if (!code) {
      setFormError('Plan code is required');
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      setFormError('Valid price is required');
      return;
    }

    const features = formData.featuresRaw
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);
      await adminApi.updateSubscriptionPlan(selectedPlan.id, {
        name,
        code,
        description: formData.description?.trim() || null,
        billingInterval: formData.billingInterval,
        price: parseFloat(formData.price).toFixed(2),
        currency: formData.currency,
        features,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.subscriptionPlans() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update subscription plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    const newStatus = !plan.isActive;
    const confirmMsg = newStatus
      ? `Activate subscription plan '${plan.name}'?`
      : `Deactivate subscription plan '${plan.name}'? New recurring quotes cannot choose this tier.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.updateSubscriptionPlan(plan.id, { isActive: newStatus });
      await queryClient.invalidateQueries({ queryKey: adminKeys.subscriptionPlans() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to update plan status');
    }
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (!window.confirm(`Delete plan '${plan.name}' (${plan.code})?`)) return;

    try {
      await adminApi.deleteSubscriptionPlan(plan.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.subscriptionPlans() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CalendarClock className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Subscription Plan Tiers
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Configure recurring SaaS packages, billing cadences, and bundled contract features for hybrid deals.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Create Subscription Plan
        </Button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search plans by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#59657d]">
          <span>
            Configured Plans: <strong className="text-[#17213a]">{plans.length}</strong>
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
            <h4 className="font-bold text-rose-900">Failed to load subscription plans</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Loading subscription plans...
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-gray-500">
            No subscription plans configured yet.
          </Card>
        ) : (
          filteredPlans.map((plan) => (
            <Card key={plan.id} hoverable className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#17213a]">{plan.name}</h3>
                    <p className="text-[10px] font-mono text-gray-400 font-bold">{plan.code}</p>
                  </div>
                  <Badge variant={plan.isActive ? 'success' : 'default'} size="sm">
                    {plan.isActive ? 'Active Plan' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#17213a]">
                    ₹ {parseFloat(plan.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500">
                    / {plan.billingInterval.toLowerCase()}
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                  {plan.description || 'Enterprise software license subscription package.'}
                </p>

                {plan.features && plan.features.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-3 space-y-1.5">
                    {plan.features.slice(0, 4).map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-gray-700">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="line-clamp-1">{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenEditModal(plan)}
                >
                  Edit Plan
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={plan.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                    onClick={() => handleToggleStatus(plan)}
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => handleDeletePlan(plan)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Plan */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Subscription Plan"
        description="Configure a new recurring contract offering for quoting."
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
              <label className="block font-semibold text-gray-700 mb-1">Plan Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Enterprise Cloud Annual"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Plan Code (Unique)</label>
              <input
                type="text"
                required
                placeholder="e.g. ENT-CLOUD-ANNUAL"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Billing Interval</label>
              <select
                value={formData.billingInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingInterval: e.target.value as 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#3568ed]"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Price per Interval</label>
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2 py-1.5">
                <span className="text-gray-400 font-semibold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Package scope and target enterprise size..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Included Features <span className="text-gray-400 font-normal">(One feature per line)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              value={formData.featuresRaw}
              onChange={(e) => setFormData({ ...formData, featuresRaw: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent font-mono focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="planActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="planActive" className="font-semibold text-gray-700 cursor-pointer">
              Plan Active and Available for Sales Quotes
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
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Plan */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Subscription Plan"
        description={`Update parameters for ${selectedPlan?.name}.`}
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
              <label className="block font-semibold text-gray-700 mb-1">Plan Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Plan Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Billing Interval</label>
              <select
                value={formData.billingInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billingInterval: e.target.value as 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#3568ed]"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Price per Interval</label>
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2 py-1.5">
                <span className="text-gray-400 font-semibold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

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
            <label className="block font-semibold text-gray-700 mb-1">
              Included Features <span className="text-gray-400 font-normal">(One feature per line)</span>
            </label>
            <textarea
              rows={3}
              value={formData.featuresRaw}
              onChange={(e) => setFormData({ ...formData, featuresRaw: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent font-mono focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editPlanActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="editPlanActive" className="font-semibold text-gray-700 cursor-pointer">
              Plan Active
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
