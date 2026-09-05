import React, { useState } from 'react';
import {
  DollarSign,
  PlusCircle,
  Edit2,
  Trash2,
  AlertCircle,
  Layers,
  Star,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAdminPriceLists, useAdminProducts, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { PriceList, PriceListItem } from '../types/admin.types';

export const AdminPriceListsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    currency: 'INR',
    isDefault: false,
    isActive: true,
  });
  const [newItemData, setNewItemData] = useState({
    productId: '',
    price: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: priceLists = [], isLoading, isError, error } = useAdminPriceLists();
  const { data: productsData } = useAdminProducts({ limit: 100 });
  const allProducts = productsData?.items || [];

  const handleOpenCreateModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      currency: 'INR',
      isDefault: false,
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (list: PriceList) => {
    setSelectedPriceList(list);
    setFormError(null);
    setFormData({
      name: list.name,
      currency: list.currency,
      isDefault: list.isDefault,
      isActive: list.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenItemsModal = async (list: PriceList) => {
    setSelectedPriceList(list);
    setIsItemsModalOpen(true);
    setNewItemData({ productId: '', price: '' });
    setFormError(null);

    try {
      setIsLoadingItems(true);
      const items = await adminApi.getPriceListItems(list.id);
      setPriceListItems(items);
    } catch (err: any) {
      alert(err.message || 'Failed to load price list items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Price list name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createPriceList({
        name: formData.name.trim(),
        currency: formData.currency.trim().toUpperCase(),
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.priceLists() });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create price list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceList) return;
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Price list name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.updatePriceList(selectedPriceList.id, {
        name: formData.name.trim(),
        currency: formData.currency.trim().toUpperCase(),
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.priceLists() });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update price list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceList) return;
    setFormError(null);

    if (!newItemData.productId) {
      setFormError('Please select a product');
      return;
    }
    if (!newItemData.price || isNaN(parseFloat(newItemData.price)) || parseFloat(newItemData.price) < 0) {
      setFormError('Valid price is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const added = await adminApi.addPriceListItem(selectedPriceList.id, {
        productId: newItemData.productId,
        price: parseFloat(newItemData.price).toFixed(2),
      });

      setPriceListItems((prev) => [...prev, added]);
      setNewItemData({ productId: '', price: '' });
      await queryClient.invalidateQueries({ queryKey: adminKeys.priceLists() });
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to add custom product price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedPriceList) return;
    try {
      await adminApi.deletePriceListItem(selectedPriceList.id, itemId);
      setPriceListItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete item price');
    }
  };

  const handleDeletePriceList = async (list: PriceList) => {
    if (list.isDefault) {
      alert('Cannot delete the default price list.');
      return;
    }
    if (!window.confirm(`Delete price list '${list.name}'?`)) return;

    try {
      await adminApi.deletePriceList(list.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.priceLists() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete price list');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
              <DollarSign className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Price List Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Define default catalogs, tier-specific rate cards, and enterprise price adjustments for sales quoting.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Create Price List
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Failed to load price lists</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Price Lists Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Loading price lists...
          </div>
        ) : priceLists.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-gray-500">
            No price lists configured yet.
          </Card>
        ) : (
          priceLists.map((list) => (
            <Card key={list.id} hoverable className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#17213a]">{list.name}</h3>
                      {list.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Default Book
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Currency: <strong className="text-gray-700">{list.currency}</strong>
                    </p>
                  </div>
                  <Badge variant={list.isActive ? 'success' : 'default'} size="sm">
                    {list.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs border border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500">Rate Card Status</span>
                  <span className="font-semibold text-blue-700">
                    {list.isDefault ? 'Applied to Standard Quotes' : 'Custom / Tier Book'}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Layers className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenItemsModal(list)}
                >
                  Configure Rates
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                    onClick={() => handleOpenEditModal(list)}
                  >
                    Edit
                  </Button>
                  {!list.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handleDeletePriceList(list)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Price List */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Price List"
        description="Add a new standard, enterprise, or regional price book."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Price List Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise Tier 1 Pricing (INR)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Currency</label>
            <input
              type="text"
              required
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
              />
              <span className="font-semibold text-gray-700">Set as System Default Price Book</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
              />
              <span className="font-semibold text-gray-700">Active immediately</span>
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
              Create Price List
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Price List */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Price List"
        description={`Configure book settings for ${selectedPriceList?.name}.`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Price List Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Currency</label>
            <input
              type="text"
              required
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
              />
              <span className="font-semibold text-gray-700">Set as System Default Price Book</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
              />
              <span className="font-semibold text-gray-700">Active</span>
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

      {/* Modal: Price List Items & Rates */}
      <Modal
        isOpen={isItemsModalOpen}
        onClose={() => setIsItemsModalOpen(false)}
        title={`Custom Product Rates — ${selectedPriceList?.name}`}
        description="Override catalog base prices with specific pricing for this price list."
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Add Item Form */}
          <form onSubmit={handleAddItemSubmit} className="rounded-xl bg-gray-50 p-3 border border-gray-200 space-y-3">
            <p className="font-bold text-[#17213a]">Add Custom Product Rate</p>

            {formError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Select Catalog Product</label>
                <select
                  required
                  value={newItemData.productId}
                  onChange={(e) => setNewItemData({ ...newItemData, productId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white p-2 focus:border-[#3568ed] focus:outline-none"
                >
                  <option value="">Choose product...</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Base: ₹{p.basePrice}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Custom Price</label>
                <div className="flex items-center gap-1 border border-gray-200 bg-white rounded-lg px-2 py-1.5">
                  <span className="text-gray-400 font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newItemData.price}
                    onChange={(e) => setNewItemData({ ...newItemData, price: e.target.value })}
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Add Rate Override
              </Button>
            </div>
          </form>

          {/* Current Custom Items Table */}
          <div>
            <p className="font-bold text-[#17213a] mb-2">Configured Overrides ({priceListItems.length})</p>
            {isLoadingItems ? (
              <p className="text-center text-gray-400 py-4">Loading item overrides...</p>
            ) : priceListItems.length === 0 ? (
              <p className="text-center text-gray-400 py-4 border border-dashed rounded-xl">
                No custom item overrides configured. Base product prices apply.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                {priceListItems.map((item) => {
                  const prod = allProducts.find((p) => p.id === item.productId) || item.product;
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-[#17213a]">{prod?.name || 'Product'}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{prod?.sku || item.productId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-700">₹ {parseFloat(item.price).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
