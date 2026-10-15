'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/calculations';
import { Pencil, Trash2, X, Loader2, AlertTriangle, CheckCircle, Search } from 'lucide-react';

export interface SalesReturnRow {
  id: string;
  returnNumber: string;
  salesInvoiceId: string;
  invoiceNumber: string;
  customerId: string | null;
  customerName: string;
  refundAmount: number;
  refundMethod: string;
  reason: string;
  returnDate: string;
}

interface Props {
  initialReturns: SalesReturnRow[];
}

export function SalesReturnsTable({ initialReturns }: Props) {
  const router = useRouter();
  const [returns, setReturns] = useState<SalesReturnRow[]>(initialReturns);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit state
  const [editingReturn, setEditingReturn] = useState<SalesReturnRow | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editRefundMethod, setEditRefundMethod] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [deletingReturn, setDeletingReturn] = useState<SalesReturnRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const openEdit = (ret: SalesReturnRow) => {
    setEditingReturn(ret);
    setEditReason(ret.reason || '');
    setEditRefundMethod(ret.refundMethod);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturn) return;
    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch(`/api/sales-returns/${editingReturn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: editReason.trim(),
          refundMethod: editRefundMethod,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setEditError(data.error || 'Failed to update return');
        return;
      }

      setReturns(prev =>
        prev.map(r =>
          r.id === editingReturn.id
            ? { ...r, reason: editReason.trim(), refundMethod: editRefundMethod }
            : r
        )
      );
      setEditingReturn(null);
      router.refresh();
    } catch {
      setEditError('Network error while updating sales return');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReturn) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/sales-returns/${deletingReturn.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.success) {
        setDeleteError(data.error || 'Failed to delete sales return');
        return;
      }

      setReturns(prev => prev.filter(r => r.id !== deletingReturn.id));
      setDeletingReturn(null);
      router.refresh();
    } catch {
      setDeleteError('Network error while deleting sales return');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredReturns = returns.filter(
    r =>
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {/* Search header */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="w-full sm:w-80 relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search return #, invoice, customer, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredReturns.length}</span> of {returns.length} returns
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Return #</th>
                <th className="p-3.5">Original Invoice #</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5 text-right">Refund Amount</th>
                <th className="p-3.5 text-center">Refund Method</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-medium">
                    No sales returns found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(r => (
                  <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3.5 font-mono text-rose-600 font-bold">{r.returnNumber}</td>
                    <td className="p-3.5 font-mono text-blue-600 font-semibold">
                      {r.invoiceNumber || r.salesInvoiceId}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{r.customerName}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(r.returnDate).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-[200px] truncate">{r.reason || 'Customer request'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(r.refundAmount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {r.refundMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          title="Edit Sales Return"
                          className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-600" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReturn(r)}
                          title="Delete / Reverse Return"
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

      {/* Edit Return Modal */}
      {editingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Sales Return: {editingReturn.returnNumber}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Refund: {formatCurrency(editingReturn.refundAmount)} • Customer: {editingReturn.customerName}
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
                <label className="block font-bold text-slate-700 mb-1">Refund Method</label>
                <select
                  value={editRefundMethod}
                  onChange={e => setEditRefundMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden transition"
                >
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CARD">CARD</option>
                  <option value="CUSTOMER_CREDIT">CUSTOMER CREDIT BALANCE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Remarks</label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={e => setEditReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden transition"
                  placeholder="Enter reason for return..."
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Sales Return?</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {deletingReturn.returnNumber} (Refund: {formatCurrency(deletingReturn.refundAmount)})
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Automatic Inventory & Ledger Reversal:
              </p>
              <ul className="list-disc list-inside text-amber-800 space-y-0.5 pl-1">
                <li>Restocked items will be deducted back from inventory</li>
                <li>Invoice returned item quantity will be restored</li>
                <li>If refunded via customer credit, credit balance will be reversed</li>
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
