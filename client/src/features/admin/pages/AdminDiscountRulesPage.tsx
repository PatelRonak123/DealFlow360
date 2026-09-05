import React, { useState } from 'react';
import {
  Percent,
  PlusCircle,
  Edit2,
  Trash2,
  Award,
  FolderTree,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  useAdminTierDiscountRules,
  useAdminCategoryDiscountRules,
  useAdminCustomerTiers,
  useAdminCategories,
  adminKeys,
} from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { TierDiscountRule, CategoryDiscountRule } from '../types/admin.types';

export const AdminDiscountRulesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'tiers' | 'categories'>('tiers');

  // Modals
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [selectedTierRule, setSelectedTierRule] = useState<TierDiscountRule | null>(null);
  const [selectedCatRule, setSelectedCatRule] = useState<CategoryDiscountRule | null>(null);

  // Forms
  const [tierFormData, setTierFormData] = useState({
    customerTierId: '',
    maxDiscountPercent: '',
    isActive: true,
  });
  const [catFormData, setCatFormData] = useState({
    categoryId: '',
    maxDiscountPercent: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: tierRules = [], isLoading: loadingTiers } = useAdminTierDiscountRules();
  const { data: categoryRules = [], isLoading: loadingCats } = useAdminCategoryDiscountRules();
  const { data: customerTiers = [] } = useAdminCustomerTiers();
  const { data: categories = [] } = useAdminCategories();

  // Handlers for Tier Rules
  const handleOpenCreateTierModal = () => {
    setSelectedTierRule(null);
    setFormError(null);
    setTierFormData({
      customerTierId: customerTiers.length > 0 ? customerTiers[0].id : '',
      maxDiscountPercent: '10.00',
      isActive: true,
    });
    setIsTierModalOpen(true);
  };

  const handleOpenEditTierModal = (rule: TierDiscountRule) => {
    setSelectedTierRule(rule);
    setFormError(null);
    setTierFormData({
      customerTierId: rule.customerTierId,
      maxDiscountPercent: rule.maxDiscountPercent,
      isActive: rule.isActive,
    });
    setIsTierModalOpen(true);
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const val = parseFloat(tierFormData.maxDiscountPercent);
    if (isNaN(val) || val < 0 || val > 100) {
      setFormError('Discount percentage must be between 0% and 100%');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedTierRule) {
        await adminApi.updateTierDiscountRule(selectedTierRule.id, {
          maxDiscountPercent: val.toFixed(2),
          isActive: tierFormData.isActive,
        });
      } else {
        await adminApi.createTierDiscountRule({
          customerTierId: tierFormData.customerTierId,
          maxDiscountPercent: val.toFixed(2),
          isActive: tierFormData.isActive,
        });
      }

      await queryClient.invalidateQueries({ queryKey: adminKeys.tierDiscountRules() });
      setIsTierModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to save tier discount rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTierRule = async (rule: TierDiscountRule) => {
    if (!window.confirm('Delete this tier discount rule?')) return;
    try {
      await adminApi.deleteTierDiscountRule(rule.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.tierDiscountRules() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete rule');
    }
  };

  // Handlers for Category Rules
  const handleOpenCreateCatModal = () => {
    setSelectedCatRule(null);
    setFormError(null);
    setCatFormData({
      categoryId: categories.length > 0 ? categories[0].id : '',
      maxDiscountPercent: '10.00',
      isActive: true,
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCatModal = (rule: CategoryDiscountRule) => {
    setSelectedCatRule(rule);
    setFormError(null);
    setCatFormData({
      categoryId: rule.categoryId,
      maxDiscountPercent: rule.maxDiscountPercent,
      isActive: rule.isActive,
    });
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const val = parseFloat(catFormData.maxDiscountPercent);
    if (isNaN(val) || val < 0 || val > 100) {
      setFormError('Discount percentage must be between 0% and 100%');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedCatRule) {
        await adminApi.updateCategoryDiscountRule(selectedCatRule.id, {
          maxDiscountPercent: val.toFixed(2),
          isActive: catFormData.isActive,
        });
      } else {
        await adminApi.createCategoryDiscountRule({
          categoryId: catFormData.categoryId,
          maxDiscountPercent: val.toFixed(2),
          isActive: catFormData.isActive,
        });
      }

      await queryClient.invalidateQueries({ queryKey: adminKeys.categoryDiscountRules() });
      setIsCatModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to save category discount rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCatRule = async (rule: CategoryDiscountRule) => {
    if (!window.confirm('Delete this category discount rule?')) return;
    try {
      await adminApi.deleteCategoryDiscountRule(rule.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.categoryDiscountRules() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete rule');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Percent className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Discount Governance Policies
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Configure maximum allowable discounts across Customer Tiers and Product Categories.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={activeTab === 'tiers' ? handleOpenCreateTierModal : handleOpenCreateCatModal}
        >
          {activeTab === 'tiers' ? 'Add Tier Discount Rule' : 'Add Category Discount Rule'}
        </Button>
      </div>

      {/* Governance Engine Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-[#3568ed] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-950">How DealFlow360 Evaluates Line Item Discounts</p>
          <p className="mt-0.5 text-blue-800">
            During quote generation, the pricing engine computes{' '}
            <code className="rounded bg-blue-100 px-1 py-0.5 font-bold font-mono">
              Effective Limit = MIN(Tier Max Discount, Category Max Discount)
            </code>
            . Discounts exceeding this limit trigger automated Sales Manager and Finance approval workflows.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition ${
            activeTab === 'tiers'
              ? 'border-[#3568ed] text-[#3568ed]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Customer Tier Limits ({tierRules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition ${
            activeTab === 'categories'
              ? 'border-[#3568ed] text-[#3568ed]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FolderTree className="h-4 w-4" />
          <span>Product Category Limits ({categoryRules.length})</span>
        </button>
      </div>

      {/* TAB 1: Customer Tier Rules */}
      {activeTab === 'tiers' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadingTiers ? (
            <div className="col-span-full py-12 text-center text-xs text-gray-400">
              Loading tier discount rules...
            </div>
          ) : tierRules.length === 0 ? (
            <Card className="col-span-full p-8 text-center text-gray-500">
              No customer tier discount rules configured.
            </Card>
          ) : (
            tierRules.map((rule) => {
              const tier = customerTiers.find((t) => t.id === rule.customerTierId) || rule.customerTier;
              return (
                <Card key={rule.id} hoverable className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Customer Tier</span>
                        <h3 className="text-base font-bold text-[#17213a] mt-0.5">
                          {tier?.name || 'Customer Tier'}
                        </h3>
                      </div>
                      <Badge variant={rule.isActive ? 'success' : 'default'} size="sm">
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mt-4 rounded-xl bg-purple-50/70 p-3.5 border border-purple-100 flex items-center justify-between">
                      <span className="text-xs text-purple-900 font-medium">Max Allowed Discount</span>
                      <span className="text-xl font-bold text-purple-700">
                        {parseFloat(rule.maxDiscountPercent).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                      onClick={() => handleOpenEditTierModal(rule)}
                    >
                      Edit Limit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handleDeleteTierRule(rule)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Category Rules */}
      {activeTab === 'categories' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadingCats ? (
            <div className="col-span-full py-12 text-center text-xs text-gray-400">
              Loading category discount rules...
            </div>
          ) : categoryRules.length === 0 ? (
            <Card className="col-span-full p-8 text-center text-gray-500">
              No product category discount rules configured.
            </Card>
          ) : (
            categoryRules.map((rule) => {
              const cat = categories.find((c) => c.id === rule.categoryId) || rule.category;
              return (
                <Card key={rule.id} hoverable className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Product Category</span>
                        <h3 className="text-base font-bold text-[#17213a] mt-0.5">
                          {cat?.name || 'Category'}
                        </h3>
                      </div>
                      <Badge variant={rule.isActive ? 'success' : 'default'} size="sm">
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mt-4 rounded-xl bg-blue-50/70 p-3.5 border border-blue-100 flex items-center justify-between">
                      <span className="text-xs text-blue-900 font-medium">Category Discount Ceiling</span>
                      <span className="text-xl font-bold text-[#3568ed]">
                        {parseFloat(rule.maxDiscountPercent).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                      onClick={() => handleOpenEditCatModal(rule)}
                    >
                      Edit Limit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handleDeleteCatRule(rule)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Tier Rule */}
      <Modal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        title={selectedTierRule ? 'Edit Customer Tier Discount Rule' : 'Add Customer Tier Discount Rule'}
        description="Set the maximum discount percentage allowed for accounts in this tier."
      >
        <form onSubmit={handleTierSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Customer Governance Tier</label>
            <select
              disabled={Boolean(selectedTierRule)}
              required
              value={tierFormData.customerTierId}
              onChange={(e) => setTierFormData({ ...tierFormData, customerTierId: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#3568ed] disabled:bg-gray-100"
            >
              {customerTiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Max Discount Allowance (%)</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={tierFormData.maxDiscountPercent}
                onChange={(e) => setTierFormData({ ...tierFormData, maxDiscountPercent: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
              <span className="text-gray-400 font-bold">%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tierRuleActive"
              checked={tierFormData.isActive}
              onChange={(e) => setTierFormData({ ...tierFormData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="tierRuleActive" className="font-semibold text-gray-700 cursor-pointer">
              Rule Active and Enforced by CPQ Engine
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTierModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Category Rule */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={selectedCatRule ? 'Edit Category Discount Rule' : 'Add Category Discount Rule'}
        description="Set the category-wide maximum discount percentage ceiling."
      >
        <form onSubmit={handleCatSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Product Category</label>
            <select
              disabled={Boolean(selectedCatRule)}
              required
              value={catFormData.categoryId}
              onChange={(e) => setCatFormData({ ...catFormData, categoryId: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#3568ed] disabled:bg-gray-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Max Category Discount (%)</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                required
                value={catFormData.maxDiscountPercent}
                onChange={(e) => setCatFormData({ ...catFormData, maxDiscountPercent: e.target.value })}
                className="w-full bg-transparent focus:outline-none"
              />
              <span className="text-gray-400 font-bold">%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catRuleActive"
              checked={catFormData.isActive}
              onChange={(e) => setCatFormData({ ...catFormData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="catRuleActive" className="font-semibold text-gray-700 cursor-pointer">
              Rule Active and Enforced by CPQ Engine
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCatModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
