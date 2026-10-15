'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, X, DollarSign, Check, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface SupplierOption {
  id: string;
  name: string;
  outstandingBalance: number;
}

interface Props {
  supplier?: SupplierOption;
  allSuppliers?: SupplierOption[];
  buttonClassName?: string;
  buttonLabel?: string;
  onPaymentSuccess?: (supplierId: string, newBalance: number) => void;
}

export function PaySupplierModal({
  supplier,
  allSuppliers = [],
  buttonClassName,
  buttonLabel = 'Pay Supplier',
  onPaymentSuccess,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(supplier?.id || allSuppliers[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeSupplier =
    supplier || allSuppliers.find(s => s.id === selectedSupplierId);

  const handleOpen = () => {
    setSelectedSupplierId(supplier?.id || allSuppliers[0]?.id || '');
    setAmount(activeSupplier?.outstandingBalance ? String(activeSupplier.outstandingBalance) : '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetId = supplier?.id || selectedSupplierId;
    if (!targetId) {
      setErrorMsg('Please select a supplier.');
      return;
    }

    const payNum = Number(amount);
    if (!payNum || payNum <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than zero.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/suppliers/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: targetId,
          amount: payNum,
          paymentMethod,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to record payment');
        setLoading(false);
        return;
      }

      setSuccessMsg(`Payment of ${formatCurrency(payNum)} successfully recorded!`);
      const newBal = data.supplier?.outstandingBalance ?? Math.max(0, (activeSupplier?.outstandingBalance ?? 0) - payNum);
      if (onPaymentSuccess) {
        onPaymentSuccess(targetId, newBal);
      }
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 700);
    } catch {
      setErrorMsg('Network error while processing payment.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          buttonClassName ||
          'px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer'
        }
      >
        <CreditCard className="w-4 h-4" /> {buttonLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Make Supplier Payment</h3>
                  <p className="text-[11px] text-slate-500">Record bill payment and update ledger statement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Supplier Selection or Display */}
              {!supplier && allSuppliers.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Supplier / Distributor *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => {
                      setSelectedSupplierId(e.target.value);
                      const found = allSuppliers.find(s => s.id === e.target.value);
                      if (found?.outstandingBalance) {
                        setAmount(String(found.outstandingBalance));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden transition"
                  >
                    {allSuppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Due: {formatCurrency(s.outstandingBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier</span>
                    <p className="text-sm font-bold text-slate-900">{activeSupplier?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Due</span>
                    <p className="text-sm font-mono font-black text-rose-600">
                      {formatCurrency(activeSupplier?.outstandingBalance || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount (Rs.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">Rs.</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden transition font-mono"
                  />
                </div>
                {activeSupplier && activeSupplier.outstandingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(activeSupplier.outstandingBalance))}
                    className="text-[10px] font-bold text-blue-600 hover:underline mt-1 cursor-pointer"
                  >
                    Pay Full Due ({formatCurrency(activeSupplier.outstandingBalance)})
                  </button>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash Drawer' },
                    { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
                    { id: 'CARD', label: 'Debit / Card' },
                    { id: 'CHEQUE', label: 'Cheque Slip' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference / Slip # */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Txn / Cheque # (Optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. HBL-98124 or CHQ-00192"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden transition font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Paid for laptop supply invoices"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden transition"
                />
              </div>

              {/* Action Buttons */}
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? 'Processing...' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
