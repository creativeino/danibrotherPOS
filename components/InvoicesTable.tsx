'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDateTimePK } from '@/lib/calculations';
import { Printer, Pencil, Trash2, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  cashierName: string;
  grandTotal: number;
  netAmountDue: number;
  customerAdvanceUsed: number;
  paymentReceived: number;
  remainingBalance: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string | null;
}

interface Props {
  invoices: SalesInvoice[];
}

export function InvoicesTable({ invoices: initialInvoices }: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SalesInvoice[]>(initialInvoices);

  // Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentReceived, setEditPaymentReceived] = useState<number | string>('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Modal State
  const [deletingInvoice, setDeletingInvoice] = useState<SalesInvoice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Open Edit Modal
  const openEdit = (inv: SalesInvoice) => {
    setEditingInvoice(inv);
    setEditCustomerName(inv.customerName);
    setEditPaymentMethod(inv.paymentMethod);
    setEditPaymentReceived(inv.paymentReceived);
    setEditNotes(inv.notes || '');
    setEditError('');
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: editCustomerName.trim(),
          paymentMethod: editPaymentMethod,
          paymentReceived: Number(editPaymentReceived) || 0,
          notes: editNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setEditError(data.error || 'Failed to update invoice');
        return;
      }

      setInvoices(prev =>
        prev.map(item => (item.id === editingInvoice.id ? { ...item, ...data.invoice } : item))
      );
      setEditingInvoice(null);
      router.refresh();
    } catch {
      setEditError('Network error while saving changes');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/invoices/${deletingInvoice.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.success) {
        setDeleteError(data.error || 'Failed to delete invoice');
        return;
      }

      setInvoices(prev => prev.filter(item => item.id !== deletingInvoice.id));
      setDeletingInvoice(null);
      router.refresh();
    } catch {
      setDeleteError('Network error while deleting invoice');
    } finally {
      setDeleteLoading(false);
    }
  };

  const [filterQuery, setFilterQuery] = useState('');

  const filteredInvoices = invoices.filter(
    inv =>
      inv.invoiceNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      inv.cashierName.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <>
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        {/* Search & Filter Header */}
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50/60">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search invoice #, customer, staff..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
            />
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredInvoices.length}</span> of {invoices.length} invoices
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3 text-right">Grand Total</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Payment</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No matching sales invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(s => (
                  <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-2 px-3 font-mono text-blue-600 font-bold">{s.invoiceNumber}</td>
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTimePK(s.invoiceDate)}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[160px]">{s.customerName}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{s.cashierName}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(s.grandTotal)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatCurrency(s.paymentReceived)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                      {formatCurrency(s.remainingBalance)}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        }`}
                      >
                        {s.paymentMethod} &bull; {s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <a
                          href={`/invoices/${s.id || s.invoiceNumber}/print`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Print Thermal Slip"
                          className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" /> Print
                        </a>

                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          title="Edit Invoice"
                          className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-600" /> Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingInvoice(s)}
                          title="Delete / Void Invoice"
                          className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
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

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Invoice: {editingInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Grand Total: {formatCurrency(editingInvoice.grandTotal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
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
                <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={e => setEditCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-hidden transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={editPaymentMethod}
                    onChange={e => setEditPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden transition"
                  >
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CUSTOMER_CREDIT">CUSTOMER CREDIT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Received (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editPaymentReceived}
                    onChange={e => setEditPaymentReceived(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Additional invoice remarks..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={editLoading}
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Void Confirmation Modal */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-start gap-3 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Invoice #{deletingInvoice.invoiceNumber}?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete and void this invoice?
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                Automatic Stock & Accounts Rollback:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                <li>All sold item quantities will be restored back to inventory.</li>
                <li>Associated serial numbers will become available again.</li>
                <li>Customer ledger and cash drawer balances will be adjusted automatically.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete & Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
