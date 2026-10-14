'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, CheckCircle, AlertTriangle, Plus, X, Tag, Boxes, Truck } from 'lucide-react';
import { ProductItem } from '@/types/pos';

interface Props {
  product: ProductItem;
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
}

export function EditProductForm({ product, categories, brands, suppliers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [categoryList, setCategoryList] = useState(categories);
  const [brandList, setBrandList] = useState(brands);
  const [supplierList, setSupplierList] = useState(suppliers);

  const [newBrandModalOpen, setNewBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandError, setBrandError] = useState('');

  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const [newSupplierModalOpen, setNewSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCompany, setNewSupplierCompany] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierOpening, setNewSupplierOpening] = useState<number | ''>(0);
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [supplierError, setSupplierError] = useState('');

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setBrandSaving(true);
    setBrandError('');
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setBrandError(data.error || 'Failed to add brand');
        setBrandSaving(false);
        return;
      }
      const created = data.brand;
      if (!brandList.some(b => b.id === created.id)) {
        setBrandList(prev => [...prev, created]);
      }
      setBrandId(created.id);
      setNewBrandName('');
      setNewBrandModalOpen(false);
    } catch (err: any) {
      setBrandError(err.message || 'Error creating brand');
    } finally {
      setBrandSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategorySaving(true);
    setCategoryError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setCategoryError(data.error || 'Failed to add category');
        setCategorySaving(false);
        return;
      }
      const created = data.category;
      if (!categoryList.some(c => c.id === created.id)) {
        setCategoryList(prev => [...prev, created]);
      }
      setCategoryId(created.id);
      setNewCategoryName('');
      setNewCategoryModalOpen(false);
    } catch (err: any) {
      setCategoryError(err.message || 'Error creating category');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    setSupplierSaving(true);
    setSupplierError('');
    try {
      const payload = {
        name: newSupplierName.trim(),
        companyName: newSupplierCompany.trim() || null,
        phone: newSupplierPhone.trim() || null,
        email: newSupplierEmail.trim() || null,
        address: newSupplierAddress.trim() || null,
        openingBalance: Number(newSupplierOpening) || 0,
      };

      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setSupplierError(data.error || 'Failed to add supplier');
        setSupplierSaving(false);
        return;
      }

      const created = data.supplier;
      if (!supplierList.some(s => s.id === created.id)) {
        setSupplierList(prev => [...prev, created]);
      }
      setSupplierId(created.id);
      setNewSupplierName('');
      setNewSupplierCompany('');
      setNewSupplierPhone('');
      setNewSupplierEmail('');
      setNewSupplierAddress('');
      setNewSupplierOpening(0);
      setNewSupplierModalOpen(false);
    } catch (err: any) {
      setSupplierError(err.message || 'Error creating supplier');
    } finally {
      setSupplierSaving(false);
    }
  };

  // Form states initialized with product values
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [barcode, setBarcode] = useState(product.barcode);
  const [categoryId, setCategoryId] = useState(product.categoryId || '');
  const [brandId, setBrandId] = useState(product.brandId || '');
  const [supplierId, setSupplierId] = useState(product.supplierId || '');
  const [modelNumber, setModelNumber] = useState(product.modelNumber || '');
  const [description, setDescription] = useState(product.description || '');
  const [unit, setUnit] = useState(product.unit || 'PIECE');
  const [costPrice, setCostPrice] = useState(String(product.costPrice));
  const [sellingPrice, setSellingPrice] = useState(String(product.sellingPrice));
  const [wholesalePrice, setWholesalePrice] = useState(
    product.wholesalePrice !== null && product.wholesalePrice !== undefined ? String(product.wholesalePrice) : ''
  );
  const [minSellingPrice, setMinSellingPrice] = useState(
    product.minSellingPrice !== null && product.minSellingPrice !== undefined ? String(product.minSellingPrice) : ''
  );
  const [quantityInStock, setQuantityInStock] = useState(String(product.quantityInStock));
  const [reorderLevel, setReorderLevel] = useState(String(product.reorderLevel));
  const [requiresSerial, setRequiresSerial] = useState(Boolean(product.requiresSerial));
  const [warrantyDurationMonths, setWarrantyDurationMonths] = useState(String(product.warrantyDurationMonths || 0));

  const isService = product.isService || product.unit === 'SERVICE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Product Name is required');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('SKU is required');
      return;
    }
    if (!barcode.trim()) {
      setErrorMsg('Barcode is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim(),
        categoryId: categoryId || null,
        brandId: brandId || null,
        supplierId: supplierId || null,
        modelNumber: modelNumber.trim() || null,
        description: description.trim() || null,
        unit,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        wholesalePrice: wholesalePrice !== '' ? Number(wholesalePrice) : null,
        minSellingPrice: minSellingPrice !== '' ? Number(minSellingPrice) : null,
        quantityInStock: isService ? 0 : Number(quantityInStock) || 0,
        reorderLevel: isService ? 0 : Number(reorderLevel) || 0,
        requiresSerial: isService ? false : requiresSerial,
        warrantyDurationMonths: Number(warrantyDurationMonths) || 0,
      };

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to update product');
        setLoading(false);
        return;
      }

      setSuccessMsg(`Product "${name}" updated successfully!`);
      setTimeout(() => {
        router.push('/products');
        router.refresh();
      }, 1000);
    } catch {
      setErrorMsg('Network error while saving changes.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-xs transition"
            title="Back to products list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Product</h1>
            <p className="text-xs text-slate-500 font-medium">Update pricing, inventory, barcode, and specifications</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-700 font-bold mb-1">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-bold">SKU (Stock Keeping Unit) *</label>
            </div>
            <input
              type="text"
              value={sku}
              onChange={e => setSku(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-bold">Barcode *</label>
              <button
                type="button"
                onClick={() => {
                  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
                  setBarcode(`2000${randomSuffix}`);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
              >
                + New Barcode
              </button>
            </div>
            <input
              type="text"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-bold">Category</label>
              <button
                type="button"
                onClick={() => {
                  setCategoryError('');
                  setNewCategoryName('');
                  setNewCategoryModalOpen(true);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                + Add Category
              </button>
            </div>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select Category</option>
              {categoryList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-bold">Brand</label>
              <button
                type="button"
                onClick={() => {
                  setBrandError('');
                  setNewBrandName('');
                  setNewBrandModalOpen(true);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                + Add Brand
              </button>
            </div>
            <select
              value={brandId}
              onChange={e => setBrandId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select Brand</option>
              {brandList.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-bold">Primary Supplier / Vendor</label>
              <button
                type="button"
                onClick={() => {
                  setSupplierError('');
                  setNewSupplierName('');
                  setNewSupplierCompany('');
                  setNewSupplierPhone('');
                  setNewSupplierEmail('');
                  setNewSupplierAddress('');
                  setNewSupplierOpening(0);
                  setNewSupplierModalOpen(true);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                + Add Supplier
              </button>
            </div>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select Supplier</option>
              {supplierList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Model Number</label>
            <input
              type="text"
              value={modelNumber}
              onChange={e => setModelNumber(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Unit of Measure</label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="PIECE">Piece / Unit</option>
              <option value="BOX">Box</option>
              <option value="PACK">Pack</option>
              <option value="METER">Meter</option>
              <option value="SET">Set</option>
              <option value="SERVICE">Service / Labor</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Warranty Duration (Months)</label>
            <input
              type="number"
              min="0"
              value={warrantyDurationMonths}
              onChange={e => setWarrantyDurationMonths(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Cost Price (Rs.) *</label>
            <input
              type="number"
              min="0"
              step="any"
              value={costPrice}
              onChange={e => setCostPrice(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Selling Price (Rs.) *</label>
            <input
              type="number"
              min="0"
              step="any"
              value={sellingPrice}
              onChange={e => setSellingPrice(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Wholesale Price (Rs.)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={wholesalePrice}
              onChange={e => setWholesalePrice(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Minimum Floor Price (Rs.)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={minSellingPrice}
              onChange={e => setMinSellingPrice(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {!isService && (
            <>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Current Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={quantityInStock}
                  onChange={e => setQuantityInStock(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={e => setReorderLevel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="requiresSerial"
                  checked={requiresSerial}
                  onChange={e => setRequiresSerial(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="requiresSerial" className="text-slate-700 font-bold select-none cursor-pointer">
                  Requires Individual Serial Number Tracking (e.g. Laptops, Motherboards, GPUs)
                </label>
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <label className="block text-slate-700 font-bold mb-1">Item Description / Technical Specs</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
          <Link
            href="/products"
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>

      {/* Quick Add Brand Modal */}
      {newBrandModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Add New Brand
              </h3>
              <button
                type="button"
                onClick={() => setNewBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="mt-4 space-y-4">
              {brandError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {brandError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  placeholder="e.g. Asus, Acer, Corsair, TP-Link, Dahua"
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBrandModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={brandSaving || !newBrandName.trim()}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {brandSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Category Modal */}
      {newCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" />
                Add New Category
              </h3>
              <button
                type="button"
                onClick={() => setNewCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              {categoryError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {categoryError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Graphic Cards, Power Supplies, Printers"
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySaving || !newCategoryName.trim()}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {categorySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Supplier Modal */}
      {newSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Add New Supplier / Vendor
              </h3>
              <button
                type="button"
                onClick={() => setNewSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="mt-4 space-y-3">
              {supplierError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {supplierError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact / Representative Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newSupplierName}
                    onChange={e => setNewSupplierName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Distributor Name
                  </label>
                  <input
                    type="text"
                    value={newSupplierCompany}
                    onChange={e => setNewSupplierCompany(e.target.value)}
                    placeholder="e.g. Hikvision Mega Traders"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newSupplierPhone}
                    onChange={e => setNewSupplierPhone(e.target.value)}
                    placeholder="e.g. 0300-1234567"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newSupplierEmail}
                    onChange={e => setNewSupplierEmail(e.target.value)}
                    placeholder="e.g. vendor@supplier.com"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Opening Balance (Rs. Payable)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newSupplierOpening}
                    onChange={e => setNewSupplierOpening(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shop / Office Address
                  </label>
                  <input
                    type="text"
                    value={newSupplierAddress}
                    onChange={e => setNewSupplierAddress(e.target.value)}
                    placeholder="e.g. Shop #42, Techno City Mall, Karachi"
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={supplierSaving || !newSupplierName.trim()}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {supplierSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
