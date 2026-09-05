import React, { useState } from 'react';
import {
  Package,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminProducts, useAdminCategories, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { AdminProduct } from '../types/admin.types';

export const AdminProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    productType: 'ONE_TIME' as 'ONE_TIME' | 'RECURRING' | 'SERVICE',
    basePrice: '',
    currency: 'INR',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: productsData, isLoading, isError, error, refetch } = useAdminProducts({
    page,
    limit,
    search: search.trim() || undefined,
    categoryId: categoryFilter || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
  });

  const { data: categories = [] } = useAdminCategories();

  const productsList = productsData?.items || [];
  const total = productsData?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleOpenCreateModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      productType: 'ONE_TIME',
      basePrice: '',
      currency: 'INR',
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (prod: AdminProduct) => {
    setSelectedProduct(prod);
    setFormError(null);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      description: prod.description || '',
      categoryId: prod.categoryId,
      productType: prod.productType,
      basePrice: prod.basePrice,
      currency: prod.currency || 'INR',
      isActive: prod.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!formData.sku.trim()) {
      setFormError('SKU code is required');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Product category is required');
      return;
    }
    if (!formData.basePrice || isNaN(parseFloat(formData.basePrice)) || parseFloat(formData.basePrice) < 0) {
      setFormError('Valid base price is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        description: formData.description?.trim() || null,
        categoryId: formData.categoryId,
        productType: formData.productType,
        basePrice: parseFloat(formData.basePrice).toFixed(2),
        currency: formData.currency,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!formData.sku.trim()) {
      setFormError('SKU code is required');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Product category is required');
      return;
    }
    if (!formData.basePrice || isNaN(parseFloat(formData.basePrice)) || parseFloat(formData.basePrice) < 0) {
      setFormError('Valid base price is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.updateProduct(selectedProduct.id, {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        description: formData.description?.trim() || null,
        categoryId: formData.categoryId,
        productType: formData.productType,
        basePrice: parseFloat(formData.basePrice).toFixed(2),
        currency: formData.currency,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (prod: AdminProduct) => {
    const newStatus = !prod.isActive;
    const confirmMsg = newStatus
      ? `Activate product '${prod.name}'?`
      : `Deactivate product '${prod.name}'? It will no longer be selectable in new sales quotations.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.updateProduct(prod.id, { isActive: newStatus });
      await queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to update product status');
    }
  };

  const handleDeleteProduct = async (prod: AdminProduct) => {
    if (!window.confirm(`Delete product '${prod.name}' (${prod.sku})?`)) return;

    try {
      await adminApi.deleteProduct(prod.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
              <Package className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Product Master Catalog
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Configure hardware, subscription licenses, and professional services available for CPQ quotations.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Add Product
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs text-[#17213a] focus:border-[#3568ed] focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
            Total Products: <strong className="text-[#17213a]">{total}</strong>
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
            <h4 className="font-bold text-rose-900">Failed to load products</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-[#f8faff] text-[#59657d] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Product &amp; SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Base Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#17213a]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading products catalog...
                  </td>
                </tr>
              ) : productsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                productsList.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-[#17213a]">{prod.name}</p>
                        <p className="text-[10px] font-mono text-gray-400">{prod.sku}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {prod.category?.name || 'Standard Category'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {prod.productType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#17213a]">
                      {prod.currency === 'INR' ? '₹' : '$'}{' '}
                      {parseFloat(prod.basePrice).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={prod.isActive ? 'success' : 'default'} size="sm">
                        {prod.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                          onClick={() => handleOpenEditModal(prod)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={prod.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => handleToggleStatus(prod)}
                        >
                          {prod.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => handleDeleteProduct(prod)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-gray-100 p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={productsData?.total || 0}
              pageSize={10}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </Card>

      {/* Modal: Create Product */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Catalog Product"
        description="Configure new hardware, software subscription, or service product line."
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
              <label className="block font-semibold text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Enterprise Gateway 9000"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">SKU Code</label>
              <input
                type="text"
                required
                placeholder="e.g. HW-GW-9000"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Product Category</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#3568ed]"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Product Type</label>
              <select
                value={formData.productType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    productType: e.target.value as 'ONE_TIME' | 'RECURRING' | 'SERVICE',
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#3568ed]"
              >
                <option value="ONE_TIME">One-Time / Physical Hardware</option>
                <option value="RECURRING">Recurring Subscription</option>
                <option value="SERVICE">Professional Service</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Base Price</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-gray-400 font-semibold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
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
              placeholder="Product specifications and features..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="prodActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="prodActive" className="font-semibold text-gray-700 cursor-pointer">
              Product Active and Available for Sales Rep Quotations
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
              Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Product */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Catalog Product"
        description={`Update details for ${selectedProduct?.name}.`}
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
              <label className="block font-semibold text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Product Category</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#3568ed]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Product Type</label>
              <select
                value={formData.productType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    productType: e.target.value as 'ONE_TIME' | 'RECURRING' | 'SERVICE',
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#3568ed]"
              >
                <option value="ONE_TIME">One-Time / Physical Hardware</option>
                <option value="RECURRING">Recurring Subscription</option>
                <option value="SERVICE">Professional Service</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Base Price</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-gray-400 font-semibold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
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

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editProdActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="editProdActive" className="font-semibold text-gray-700 cursor-pointer">
              Product Active
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
