import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, PlusCircle, Boxes } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INITIAL_PRODUCTS } from '../data/catalogData';
import { formatINR } from '@/utils/formatters';

export const ProductsCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = INITIAL_PRODUCTS.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.sku.toLowerCase().includes(search.toLowerCase()) ||
      prod.description.toLowerCase().includes(search.toLowerCase());

    if (selectedCategory === 'all') return matchesSearch;
    return matchesSearch && prod.category === selectedCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7ebf7] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17213a]">
            Product &amp; Services Catalog
          </h1>
          <p className="mt-1 text-sm text-[#59657d]">
            Browse hardware models, SaaS platform subscriptions, and professional engineering services.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle className="h-4 w-4" />}
          onClick={() => navigate('/quotations/new')}
        >
          Build New CPQ Quote
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-[#e7ebf7] bg-white p-4 shadow-2xs">
        <div className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500 focus-within:border-[#3568ed] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3568ed]/15 transition">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-[#17213a] placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'hardware', label: 'Hardware' },
            { id: 'software', label: 'Software' },
            { id: 'cloud_subscription', label: 'Cloud' },
            { id: 'professional_services', label: 'Services' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#3568ed] text-white font-semibold'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eef2f9] bg-[#fbfcfe] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8491aa]">
                  <th className="py-3 px-6 font-semibold">SKU &amp; Product</th>
                  <th className="py-3 font-semibold">Category</th>
                  <th className="py-3 font-semibold">Billing Model</th>
                  <th className="py-3 font-semibold">List Price</th>
                  <th className="py-3 font-semibold">Cost (COGS)</th>
                  <th className="py-3 font-semibold">Discount Ceiling</th>
                  <th className="py-3 font-semibold">Warehouse Stock</th>
                  <th className="py-3 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f5fb]">
                {filteredProducts.map((prod) => {
                  const totalStock = prod.warehouses.reduce((acc, w) => acc + w.availableStock, 0);

                  return (
                    <tr key={prod.id} className="hover:bg-[#f8faff] transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#3568ed]">
                            <Package className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-bold text-[#17213a]">{prod.name}</p>
                            <span className="text-[10px] text-gray-400 font-mono">SKU: {prod.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 capitalize">
                          {prod.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 text-gray-600">
                        {prod.billingType === 'recurring' ? `${prod.billingPeriod} SaaS` : 'One-Time'}
                      </td>
                      <td className="py-4 font-bold text-[#17213a]">
                        {formatINR(prod.basePrice)}
                      </td>
                      <td className="py-4 text-gray-500 font-medium">
                        {formatINR(prod.costPrice)}
                      </td>
                      <td className="py-4">
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          Max {prod.discountCeilingPercent}%
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <Boxes className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-semibold text-emerald-700">
                            {totalStock > 200 ? 'Cloud Capacity' : `${totalStock} in stock`}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate('/quotations/new')}
                        >
                          Quote Item
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
