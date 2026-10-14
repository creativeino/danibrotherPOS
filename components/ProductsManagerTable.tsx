'use client';

import React, { useState, useTransition } from 'react';
import { ProductItem } from '@/types/pos';
import { formatCurrency } from '@/lib/calculations';
import { 
  Search, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Barcode, 
  Package, 
  Wrench, 
  CheckCircle,
  ExternalLink,
  Filter,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  initialProducts: ProductItem[];
}

export function ProductsManagerTable({ initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'hardware' | 'services' | 'lowStock'>('all');
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Counts for tabs
  const totalCount = products.length;
  const hardwareCount = products.filter(p => !p.isService && p.unit !== 'SERVICE').length;
  const serviceCount = products.filter(p => p.isService || p.unit === 'SERVICE').length;
  const lowStockCount = products.filter(
    p => !p.isService && p.unit !== 'SERVICE' && p.quantityInStock <= p.reorderLevel
  ).length;

  // Filtered items
  const filteredProducts = products.filter(p => {
    const isService = p.isService || p.unit === 'SERVICE';
    const isLow = !isService && p.quantityInStock <= p.reorderLevel;

    // Filter by tab
    if (activeTab === 'hardware' && isService) return false;
    if (activeTab === 'services' && !isService) return false;
    if (activeTab === 'lowStock' && !isLow) return false;

    // Filter by search query
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
      (p.brandName && p.brandName.toLowerCase().includes(q)) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q)) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(q))
    );
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete product');
      }

      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Search Bar & Filter Buttons */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by product name, barcode, SKU, category, brand..."
              className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500 transition shadow-2xs"
            />
          </div>

          {/* Quick Stats or Actions */}
          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <Link
              href="/barcodes"
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-200 shadow-2xs transition"
            >
              <Barcode className="w-3 h-3 text-blue-600" /> Barcode Printer
            </Link>
            <Link
              href="/products/new"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
            >
              <Plus className="w-3 h-3" /> + Add Product
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 border-t border-slate-100 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-3 h-3" /> All Items ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hardware')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'hardware'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-3 h-3" /> Hardware & Stock ({hardwareCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'services'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Wrench className="w-3 h-3" /> Services & Repairs ({serviceCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lowStock')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'lowStock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-50 text-amber-700 hover:bg-amber-50 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> Low Stock ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Main Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">SKU & Barcode</th>
                <th className="py-2.5 px-3 min-w-[260px]">Product / Service Name</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Category & Brand</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Cost Price</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Selling Price</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Stock Status</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Tracking</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    No products found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isService = p.isService || p.unit === 'SERVICE';
                  const isLow = !isService && p.quantityInStock <= p.reorderLevel;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {/* SKU & Barcode */}
                      <td className="py-2 px-3 font-mono whitespace-nowrap">
                        <span className="text-blue-600 font-bold block text-[11px]">{p.sku}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Barcode className="w-2.5 h-2.5 text-slate-400" /> {p.barcode}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-2 px-3 text-slate-900">
                        <div className="font-bold text-slate-900 leading-tight text-xs">{p.name}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {p.modelNumber && (
                            <span className="text-[9px] text-slate-500 font-mono bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                              Mod: {p.modelNumber}
                            </span>
                          )}
                          {p.supplierName && (
                            <span className="text-[9px] text-slate-600 bg-purple-50 border border-purple-200 px-1 py-0.2 rounded font-medium">
                              Vendor: {p.supplierName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        <div className="font-medium text-slate-800 text-[11px]">{p.categoryName || 'General'}</div>
                        {p.brandName && (
                          <div className="text-[10px] text-slate-400">{p.brandName}</div>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-2 px-3 text-right font-mono text-slate-600 whitespace-nowrap text-[11px]">
                        {isService ? (
                          <span className="text-slate-400 italic text-[10px]">—</span>
                        ) : (
                          formatCurrency(p.costPrice)
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-[11px]">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Stock Status */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {isService ? (
                          <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Service
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              p.quantityInStock <= 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {p.quantityInStock} {p.unit}
                          </span>
                        )}
                      </td>

                      {/* Type / Tracking */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {isService ? (
                          <span className="text-slate-400 text-[9px] font-medium">Non-Inv</span>
                        ) : p.requiresSerial ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            SERIAL
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[9px]">Standard</span>
                        )}
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/products/${p.id}/edit`}
                            className="px-2 py-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-semibold shadow-2xs transition inline-flex items-center gap-1"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(p);
                              setDeleteError(null);
                            }}
                            className="px-2 py-1 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-[11px] font-semibold shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kya aap waqayi is product ko catalog se delete karna chahte hain? Yeh product catalog se permanent remove ho jayegi.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-900">{deleteTarget.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                SKU: <strong className="text-slate-800">{deleteTarget.sku}</strong> • Barcode: <strong className="text-slate-800">{deleteTarget.barcode}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Current Stock: <strong className="text-slate-800">{deleteTarget.quantityInStock} {deleteTarget.unit}</strong> • Selling Price: <strong className="text-slate-800">{formatCurrency(deleteTarget.sellingPrice)}</strong>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>Deleting...</>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
