'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Truck, PackagePlus, X, Loader2 } from 'lucide-react';
import { ProductItem } from '@/types/pos';

interface SupplierOption {
  id: string;
  name: string;
  companyName?: string | null;
}

interface Props {
  suppliers: SupplierOption[];
  products: ProductItem[];
}

export function NewPurchaseModal({ suppliers, products }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState<number | string>(products[0]?.costPrice || '');
  const [amountPaid, setAmountPaid] = useState<number | string>('');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  const handleProductChange = (pId: string) => {
    setProductId(pId);
    const p = products.find(prod => prod.id === pId);
    if (p) {
      setUnitCost(p.costPrice);
    }
  };

  const totalBill = (Number(quantity) || 0) * (Number(unitCost) || 0);

  const handleOpen = () => {
    setError('');
    if (suppliers.length > 0 && !supplierId) setSupplierId(suppliers[0].id);
    if (products.length > 0 && !productId) {
      setProductId(products[0].id);
      setUnitCost(products[0].costPrice);
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }
    if (!productId) {
      setError('Please select a product.');
      return;
    }
    if (Number(quantity) <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (Number(unitCost) < 0) {
      setError('Unit Cost Price cannot be negative.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          supplierInvoiceRef: supplierInvoiceRef.trim() || null,
          items: [
            {
              productId,
              quantity: Number(quantity),
              unitCost: Number(unitCost),
              lineDiscount: 0,
              serialNumbers: [],
            },
          ],
          discountTotal: 0,
          taxAmount: 0,
          shippingCost: 0,
          supplierAdvanceUsed: 0,
          amountPaid: amountPaid ? Number(amountPaid) : 0,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to record purchase.');
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Network error. Failed to save purchase bill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Record Purchase / Stock In
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Record Goods In / Purchase Bill</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Add incoming inventory from vendor and update accounts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Select Supplier */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Supplier / Vendor *
                  </label>
                  <select
                    required
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden transition"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.companyName ? `(${s.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier Bill / Inv Ref */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supplier Bill / Invoice #
                  </label>
                  <input
                    type="text"
                    value={supplierInvoiceRef}
                    onChange={e => setSupplierInvoiceRef(e.target.value)}
                    placeholder="e.g. BILL-9921 / INV-402"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden transition font-mono"
                  />
                </div>

                {/* Amount Paid Now */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Paid Now (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    placeholder="0 (if full credit)"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden transition font-mono"
                  />
                </div>

                {/* Select Product */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product To Restock *
                  </label>
                  <select
                    required
                    value={productId}
                    onChange={e => handleProductChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden transition"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (In Stock: {p.quantityInStock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden transition font-mono"
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit Purchase Cost (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={unitCost}
                    onChange={e => setUnitCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden transition font-mono"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-600 font-semibold">Total Purchase Bill:</span>
                <span className="font-bold text-base text-blue-600">
                  Rs. {totalBill.toLocaleString()}
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Purchase & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
