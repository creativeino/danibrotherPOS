'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X, Loader2, AlertTriangle, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import Link from 'next/link';
import { PaySupplierModal } from '@/components/PaySupplierModal';

export interface SupplierItem {
  id: string;
  supplierNumber: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  outstandingBalance: number;
}

interface Props {
  initialSuppliers: SupplierItem[];
}

export function SuppliersManagerTable({ initialSuppliers }: Props) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers);

  React.useEffect(() => {
    setSuppliers(initialSuppliers);
  }, [initialSuppliers]);

  // Edit State
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete State
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const openEdit = (s: SupplierItem) => {
    setEditingSupplier(s);
    setEditName(s.name);
    setEditCompany(s.companyName || '');
    setEditPhone(s.phone || '');
    setEditEmail(s.email || '');
    setEditAddress(s.address || '');
    setEditBalance(String(s.outstandingBalance || 0));
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    setIsSaving(true);
    setEditError('');

    try {
      const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          companyName: editCompany.trim() || null,
          phone: editPhone.trim() || null,
          email: editEmail.trim() || null,
          address: editAddress.trim() || null,
          outstandingBalance: Number(editBalance) || 0,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setEditError(data.error || 'Failed to update supplier');
        setIsSaving(false);
        return;
      }

      setSuppliers(prev =>
        prev.map(item => (item.id === editingSupplier.id ? { ...item, ...data.supplier } : item))
      );
      setEditingSupplier(null);
      router.refresh();
    } catch (err: any) {
      setEditError(err.message || 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/suppliers/${deletingSupplier.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.success) {
        setDeleteError(data.error || 'Failed to delete supplier');
        setIsDeleting(false);
        return;
      }

      setSuppliers(prev => prev.filter(item => item.id !== deletingSupplier.id));
      setDeletingSupplier(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || 'Network error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5 whitespace-nowrap">Supplier #</th>
                <th className="p-3.5 whitespace-nowrap">Distributor / Vendor</th>
                <th className="p-3.5">Company & Address</th>
                <th className="p-3.5 whitespace-nowrap">Phone</th>
                <th className="p-3.5 text-right whitespace-nowrap">Payable Balance (Due)</th>
                <th className="p-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No suppliers added yet. Click &quot;+ Add New Supplier&quot; above.
                  </td>
                </tr>
              ) : (
                suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-purple-600 font-bold whitespace-nowrap">
                      {s.supplierNumber}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{s.name}</td>
                    <td className="p-3.5 text-slate-500">
                      <div className="font-medium text-slate-700">{s.companyName || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.address || ''}</div>
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">{s.phone || 'N/A'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                      {formatCurrency(s.outstandingBalance)}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <PaySupplierModal
                          supplier={{ id: s.id, name: s.name, outstandingBalance: s.outstandingBalance }}
                          buttonLabel="Pay"
                          onPaymentSuccess={(supplierId, newBalance) => {
                            setSuppliers(prev =>
                              prev.map(item => (item.id === supplierId ? { ...item, outstandingBalance: newBalance } : item))
                            );
                          }}
                          buttonClassName="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                        />

                        <Link
                          href={`/suppliers/${s.id}/ledger`}
                          className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition"
                          title="View Statement"
                        >
                          Ledger
                        </Link>

                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          title="Edit Supplier"
                          className="px-2 py-1 bg-white hover:bg-amber-50 text-amber-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-600" /> Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingSupplier(s)}
                          title="Delete Supplier"
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

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Supplier Details</h3>
                  <p className="text-xs text-slate-500 font-mono">{editingSupplier.supplierNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSupplier(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Company / Business Name</label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={e => setEditCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Address / Market Location</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Payable Balance (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editBalance}
                  onChange={e => setEditBalance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 text-slate-900 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Supplier?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{deletingSupplier.name}</strong> ({deletingSupplier.supplierNumber})? This will remove all their records.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />} Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
