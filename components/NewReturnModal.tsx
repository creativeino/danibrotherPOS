'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface SalesInvoiceSummary {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    returnedQuantity?: number;
    serialNumbers?: string | null;
  }>;
}

interface Props {
  invoices: SalesInvoiceSummary[];
}

export function NewReturnModal({ invoices }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[0]?.id || '');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<'RESTOCKABLE' | 'DAMAGED_OR_DEFECTIVE'>('RESTOCKABLE');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CUSTOMER_CREDIT'>('CASH');
  const [reason, setReason] = useState('Customer returned item');
  const [serialNumber, setSerialNumber] = useState('');

  const activeInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
  const availableItems = activeInvoice?.items || [];
  const activeItem = availableItems.find(i => i.id === selectedItemId) || availableItems[0];

  const handleOpen = () => {
    setError('');
    if (invoices.length > 0) {
      setSelectedInvoiceId(invoices[0].id);
      if (invoices[0].items.length > 0) {
        setSelectedItemId(invoices[0].items[0].id);
      }
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setError('');
    }
  };

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find(i => i.id === invId);
    if (inv && inv.items.length > 0) {
      setSelectedItemId(inv.items[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activeInvoice) {
      setError('Please select a valid sales invoice.');
      return;
    }
    if (!activeItem) {
      setError('Please select an item to return.');
      return;
    }

    const retQty = Number(quantity);
    if (!retQty || retQty <= 0) {
      setError('Return quantity must be at least 1.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/sales-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesInvoiceId: activeInvoice.id,
          refundMethod,
          reason: reason.trim(),
          items: [
            {
              salesInvoiceItemId: activeItem.id,
              productId: activeItem.productId,
              quantity: retQty,
              condition,
              serialNumber: serialNumber.trim() || undefined,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to process return');
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Network error. Failed to process return.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" /> Process Return / RMA
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Process Sales Return & Restock</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Refund customer and return goods to stock</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Sales Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={e => handleInvoiceChange(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 font-mono"
                >
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} ({new Date(inv.invoiceDate).toLocaleDateString('en-PK')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Item to Return *</label>
                <select
                  value={selectedItemId || activeItem?.id}
                  onChange={e => setSelectedItemId(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                >
                  {availableItems.map(item => {
                    const remaining = item.quantity - (item.returnedQuantity || 0);
                    return (
                      <option key={item.id} value={item.id}>
                        {item.productName} — Sold: {item.quantity}, Returnable: {remaining} @ Rs. {item.unitPrice}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Return Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max={activeItem ? activeItem.quantity - (activeItem.returnedQuantity || 0) : 1}
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Stock Condition</label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="RESTOCKABLE">Good / Restock to Inventory</option>
                    <option value="DAMAGED_OR_DEFECTIVE">Damaged / Defective (No Restock)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Refund Method</label>
                <select
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                >
                  <option value="CASH">Cash Refund (Deducts from Cash Drawer)</option>
                  <option value="CUSTOMER_CREDIT">Store Credit / Customer Deposit Balance</option>
                  <option value="BANK_TRANSFER">Bank Transfer / Online</option>
                  <option value="CARD">Card Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Return Reason *</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Customer changed mind or wrong model purchased"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              {activeItem?.serialNumbers && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Serial Number to Restock</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={e => setSerialNumber(e.target.value)}
                    placeholder={activeItem.serialNumbers}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Processing...' : 'Complete Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
