'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  Barcode,
  Save,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Tag,
  Shield,
  Truck,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; name: string; companyName?: string | null }>;
}

export function NewProductForm({ categories, brands, suppliers = [] }: Props) {
  const router = useRouter();

  // Dynamic brand, category, and supplier state
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

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [brandId, setBrandId] = useState(brands[0]?.id || '');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [modelNumber, setModelNumber] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<'PIECE' | 'BOX' | 'PACK' | 'METER' | 'SET'>('PIECE');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [minSellingPrice, setMinSellingPrice] = useState<number | ''>('');
  const [quantityInStock, setQuantityInStock] = useState<number | ''>(1);
  const [reorderLevel, setReorderLevel] = useState<number | ''>(3);
  const [requiresSerial, setRequiresSerial] = useState(false);
  const [warrantyDurationMonths, setWarrantyDurationMonths] = useState<number | ''>(12);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  // Generate Barcode (standard retail numeric barcode) & SKU
  const generateBarcodeAndSku = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const generatedBarcode = `2000${randomSuffix}`;
    setBarcode(generatedBarcode);

    if (name.trim()) {
      const initials = name
        .trim()
        .split(' ')
        .slice(0, 3)
        .map(w => w[0].toUpperCase())
        .join('');
      setSku(`${initials}-${Math.floor(100 + Math.random() * 900)}`);
    } else {
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !sku || !barcode || costPrice === '' || sellingPrice === '') {
      setErrorMsg('Please fill in required fields: Product Name, SKU, Barcode, Cost Price, and Selling Price.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        sku,
        barcode,
        categoryId: categoryId || null,
        brandId: brandId || null,
        supplierId: supplierId || null,
        modelNumber: modelNumber || null,
        description: description || null,
        unit,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        wholesalePrice: wholesalePrice !== '' ? Number(wholesalePrice) : null,
        minSellingPrice: minSellingPrice !== '' ? Number(minSellingPrice) : null,
        quantityInStock: quantityInStock !== '' ? Number(quantityInStock) : 0,
        reorderLevel: reorderLevel !== '' ? Number(reorderLevel) : 3,
        requiresSerial,
        warrantyDurationMonths: warrantyDurationMonths !== '' ? Number(warrantyDurationMonths) : 0,
        taxRatePercent: 0,
        active: true,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to add product');
        setLoading(false);
        return;
      }

      setSuccessMsg(`Product "${name}" added successfully! Barcode: ${barcode}`);
      setTimeout(() => {
        router.push('/products');
      }, 700);
    } catch {
      setErrorMsg('Network error while saving product.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Product</h1>
            <p className="text-xs text-slate-500 font-medium">
              Register laptops, CCTV equipment, accessories, components, and assign barcodes
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-600" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-600 font-bold mb-1">
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. HP EliteBook 840 G7 Core i7 16GB 512GB SSD or Dahua 2MP Bullet Camera"
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 font-bold">Category *</label>
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
                {categoryList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 font-bold">Brand *</label>
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
                {brandList.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 font-bold">
                  Supplier / Distributor *
                </label>
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
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-medium"
              >
                <option value="">-- Select Supplier / Distributor --</option>
                {supplierList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.companyName ? `(${s.companyName})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Initial stock purchase will be logged to this supplier&apos;s ledger account.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Model Number</label>
              <input
                type="text"
                value={modelNumber}
                onChange={e => setModelNumber(e.target.value)}
                placeholder="e.g. 840-G7 / DS-2CE16D0T"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Unit of Measurement</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="PIECE">Piece (Individual Item)</option>
                <option value="BOX">Box</option>
                <option value="PACK">Pack</option>
                <option value="SET">Set / Kit</option>
                <option value="METER">Meter (Cabling)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Barcode & SKU Management */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-emerald-600" /> Barcode & Identification
            </h2>
            <button
              type="button"
              onClick={generateBarcodeAndSku}
              className="px-3 py-1 bg-white hover:bg-slate-50 text-blue-600 font-bold rounded-lg text-xs flex items-center gap-1 border border-slate-200 shadow-2xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Generate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Barcode Number * (Scan Box / Type Custom Barcode)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder="e.g. LAP-HP84-1029 or scan from product box..."
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Type your custom product-based barcode, scan the box with a USB scanner, or click <strong>Auto-Generate</strong>.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Stock Keeping Unit (SKU) *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. HIK-CAM-1080"
                className="w-full bg-white border border-slate-300 focus:border-blue-600 rounded-xl p-2.5 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Opening Stock */}
        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-600" /> Pricing & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Cost Price (Rs.) *</label>
              <input
                type="number"
                required
                min="0"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 8500"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Retail Selling Price (Rs.) *</label>
              <input
                type="number"
                required
                min="0"
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 10500"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-emerald-700 font-bold font-mono focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Opening Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={quantityInStock}
                onChange={e => setQuantityInStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Initial on-hand quantity"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Low Stock Alert Level</label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={e => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Alert at e.g. 3"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Serial Number & Warranty Settings */}
        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" /> Tracking & Warranty
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="requiresSerial"
                checked={requiresSerial}
                onChange={e => setRequiresSerial(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="requiresSerial" className="cursor-pointer">
                <span className="font-bold text-slate-900 block">Require Individual Serial Number</span>
                <span className="text-[11px] text-slate-500">
                  Enable for Laptops, Assembled PCs, CCTV DVRs/NVRs, and SSDs so the cashier must capture/scan each unique serial at checkout.
                </span>
              </label>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Warranty Period (in Months)
              </label>
              <input
                type="number"
                min="0"
                value={warrantyDurationMonths}
                onChange={e => setWarrantyDurationMonths(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 12 for 1 Year"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-[10px] text-slate-400 mt-1">Printed on thermal receipts and invoice printouts.</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
          <Link
            href="/products"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-xs transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving to Database...' : 'Save & Register Product'}
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
