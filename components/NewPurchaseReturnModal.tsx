'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw, X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface SupplierOption {
  id: string;
  name: string;
  companyName?: string | null;
  outstandingBalance: number;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  quantityInStock: number;
}

interface PurchaseInvoiceOption {
  id: string;
  purchaseNumber: string;
  supplierId: string;
}

interface Props {
  suppliers: SupplierOption[];
  products: ProductOption[];
  purchaseInvoices: PurchaseInvoiceOption[];
}

export function NewPurchaseReturnModal({ suppliers, products, purchaseInvoices }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [purchaseInvoiceId, setPurchaseInvoiceId] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState<number | string>(products[0]?.costPrice || '');
  const [reason, setReason] = useState('Damaged / Defective merchandise returned to vendor');

  const selectedProduct = products.find(p => p.id === productId);
  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const filteredInvoices = purchaseInvoices.filter(p => !supplierId || p.supplierId === supplierId);

  const totalBill = (Number(quantity) || 0) * (Number(unitCost) || 0);

  const handleProductChange = (pId: string) => {
    setProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setUnitCost(prod.costPrice);
    }
  };

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
      setError('Return quantity must be at least 1.');
      return;
    }
    if (selectedProduct && Number(quantity) > selectedProduct.quantityInStock) {
      setError(`Return quantity cannot exceed current stock (${selectedProduct.quantityInStock} available).`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/purchase-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          purchaseInvoiceId: purchaseInvoiceId || null,
          reason: reason.trim(),
          items: [
            {
              productId,
              quantity: Number(quantity),
              unitCost: Number(unitCost) || 0,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to process purchase return');
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Network error while processing purchase return.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
      >
        <RotateCw className="w-4 h-4" /> Create Purchase Return (Debit Note)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Return Merchandise to Supplier</h2>
                  <p className="text-[11px] text-slate-500">Deduct inventory stock & reduce supplier payable dues</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Supplier / Distributor *
                </label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 transition outline-hidden"
                >
                  <option value="" disabled>-- Select Vendor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.companyName ? `(${s.companyName})` : ''} - Due: {formatCurrency(s.outstandingBalance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Original Purchase Invoice (Optional)
                </label>
                <select
                  value={purchaseInvoiceId}
                  onChange={e => setPurchaseInvoiceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 transition outline-hidden"
                >
                  <option value="">-- No specific invoice (General Return) --</option>
                  {filteredInvoices.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.purchaseNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product to Return *
                </label>
                <select
                  value={productId}
                  onChange={e => handleProductChange(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 transition outline-hidden"
                >
                  <option value="" disabled>-- Select Catalog Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.quantityInStock}) - Cost: {formatCurrency(p.costPrice)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Return Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct?.quantityInStock || 9999}
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 transition outline-hidden"
                  />
                  {selectedProduct && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Available Stock: {selectedProduct.quantityInStock}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit Return Cost (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={unitCost}
                    onChange={e => setUnitCost(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 transition outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Return *
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  placeholder="e.g. Broken screen, defective sensor, wrong model delivered"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-800 transition outline-hidden"
                />
              </div>

              {/* Summary box */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Total Debit Note Value:</span>
                  <span className="font-mono text-sm text-amber-800">{formatCurrency(totalBill)}</span>
                </div>
                <p className="text-[10px] text-amber-700">
                  This will deduct {quantity} units from catalog stock and automatically reduce the supplier's payable balance by {formatCurrency(totalBill)}.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || totalBill <= 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-3.5 h-3.5" /> Confirm Purchase Return
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
