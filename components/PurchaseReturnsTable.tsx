'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/calculations';
import { Pencil, Trash2, X, Loader2, AlertTriangle, Search } from 'lucide-react';

export interface PurchaseReturnRow {
  id: string;
  returnNumber: string;
  purchaseNumber: string | null;
  supplierName: string;
  returnDate: string;
  totalAmount: number;
  reason: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
}

interface Props {
  initialReturns: PurchaseReturnRow[];
}

export function PurchaseReturnsTable({ initialReturns }: Props) {
  const router = useRouter();
  const [returns, setReturns] = useState<PurchaseReturnRow[]>(initialReturns);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit state
  const [editingReturn, setEditingReturn] = useState<PurchaseReturnRow | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [deletingReturn, setDeletingReturn] = useState<PurchaseReturnRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const openEdit = (ret: PurchaseReturnRow) => {
    setEditingReturn(ret);
    setEditReason(ret.reason || '');
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturn) return;
    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch(`/api/purchase-returns/${editingReturn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: editReason.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setEditError(data.error || 'Failed to update purchase return');
        return;
      }

      setReturns(prev =>
        prev.map(r => (r.id === editingReturn.id ? { ...r, reason: editReason.trim() } : r))
      );
      setEditingReturn(null);
      router.refresh();
    } catch {
      setEditError('Network error while updating purchase return');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReturn) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/purchase-returns/${deletingReturn.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.success) {
        setDeleteError(data.error || 'Failed to delete purchase return');
        return;
      }

      setReturns(prev => prev.filter(r => r.id !== deletingReturn.id));
      setDeletingReturn(null);
      router.refresh();
    } catch {
      setDeleteError('Network error while deleting purchase return');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredReturns = returns.filter(
    r =>
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.purchaseNumber && r.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="w-full sm:w-80 relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search debit note #, supplier, invoice, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredReturns.length}</span> of {returns.length} debit notes
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Debit Note #</th>
                <th className="p-3.5">Supplier / Vendor</th>
                <th className="p-3.5">Invoice Ref</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Returned Items</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5 text-right">Debit Note Total</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-medium">
                    No purchase returns recorded yet.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(r => (
                  <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3.5 font-mono text-amber-600 font-bold">{r.returnNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{r.supplierName}</td>
                    <td className="p-3.5 font-mono text-blue-600">
                      {r.purchaseNumber || '—'}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(r.returnDate).toLocaleDateString('en-PK')}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {r.items.map(item => (
                        <div key={item.id} className="text-[11px]">
                          <span className="font-semibold">{item.productName}</span> ({item.quantity} pcs @ {formatCurrency(item.unitCost)})
                        </div>
                      ))}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-[200px] truncate">{r.reason}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(r.totalAmount)}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          title="Edit Purchase Return"
                          className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-600" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReturn(r)}
                          title="Delete / Reverse Purchase Return"
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Purchase Return Modal */}
      {editingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Debit Note: {editingReturn.returnNumber}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Supplier: {editingReturn.supplierName} • Total: {formatCurrency(editingReturn.totalAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingReturn(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Remarks</label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden transition"
                  placeholder="Enter return reason..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReturn(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Reverse Confirmation Modal */}
      {deletingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Purchase Return?</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {deletingReturn.returnNumber} (Total: {formatCurrency(deletingReturn.totalAmount)})
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Automatic Inventory & Payable Reversal:
              </p>
              <ul className="list-disc list-inside text-amber-800 space-y-0.5 pl-1">
                <li>Returned items will be re-added to inventory stock</li>
                <li>Supplier outstanding payable balance will be re-applied</li>
                <li>Debit note reversal will be recorded in supplier ledger</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeletingReturn(null)}
                disabled={deleteLoading}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete & Reverse
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
