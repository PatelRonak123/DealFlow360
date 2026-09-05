import React, { useState } from 'react';
import {
  FolderTree,
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
import { useAdminCategories, adminKeys } from '../hooks/useAdmin';
import { adminApi } from '../api/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import { ProductCategory } from '../types/admin.types';

export const AdminProductCategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query
  const { data: categories = [], isLoading, isError, error, refetch } = useAdminCategories();

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
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

  const handleOpenEditModal = (cat: ProductCategory) => {
    setSelectedCategory(cat);
    setFormError(null);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formData.name.trim();
    if (!name) {
      setFormError('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createCategory({
        name,
        description: formData.description?.trim() || null,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setFormError(null);

    const name = formData.name.trim();
    if (!name) {
      setFormError('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.updateCategory(selectedCategory.id, {
        name,
        description: formData.description?.trim() || null,
        isActive: formData.isActive,
      });

      await queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.products() });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: ProductCategory) => {
    const newStatus = !cat.isActive;
    const confirmMsg = newStatus
      ? `Activate category '${cat.name}'?`
      : `Deactivate category '${cat.name}'? Active products under this category cannot be used in new quotes.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.updateCategory(cat.id, { isActive: newStatus });
      await queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to update category status');
    }
  };

  const handleDeleteCategory = async (cat: ProductCategory) => {
    if (!window.confirm(`Delete product category '${cat.name}'?`)) {
      return;
    }

    try {
      await adminApi.deleteCategory(cat.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e7ebf7] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FolderTree className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
              Product Category Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#59657d]">
            Organize the master catalog into taxonomy categories for discount limits and recommendation rules.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={handleOpenCreateModal}
        >
          Create Category
        </Button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#59657d]">
          <span>
            Total Categories: <strong className="text-[#17213a]">{categories.length}</strong>
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
            <h4 className="font-bold text-rose-900">Failed to load categories</h4>
            <p className="mt-1 text-rose-700">{(error as Error)?.message || 'Database error'}</p>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Loading product categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-gray-500">
            No categories found matching &quot;{search}&quot;.
          </Card>
        ) : (
          filteredCategories.map((cat) => (
            <Card key={cat.id} hoverable className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <FolderTree className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#17213a]">{cat.name}</h3>
                      <p className="text-[10px] text-gray-400">
                        Added {new Date(cat.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={cat.isActive ? 'success' : 'default'} size="sm">
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <p className="mt-3 text-xs text-gray-600 line-clamp-2">
                  {cat.description || 'Standard product taxonomy category.'}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => handleOpenEditModal(cat)}
                >
                  Edit
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cat.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                    onClick={() => handleToggleStatus(cat)}
                  >
                    {cat.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Category */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Product Category"
        description="Add a new catalog category for products, services, or recurring licenses."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Cloud Infrastructure Services"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Optional description of product lines in this category..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-transparent focus:outline-none focus:border-[#3568ed]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="catActive" className="font-semibold text-gray-700 cursor-pointer">
              Active immediately for new products
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
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Category */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product Category"
        description={`Update settings for ${selectedCategory?.name}.`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Category Name</label>
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
              id="editCatActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-[#3568ed] focus:ring-[#3568ed]"
            />
            <label htmlFor="editCatActive" className="font-semibold text-gray-700 cursor-pointer">
              Active Category
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
