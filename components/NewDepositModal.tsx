'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Wallet, X, Loader2 } from 'lucide-react';

interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
  depositBalance: number;
}

interface Props {
  customers: CustomerOption[];
}

export function NewDepositModal({ customers }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [notes, setNotes] = useState('');

  const handleOpen = () => {
    setError('');
    setAmount('');
    setNotes('');
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
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

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount <= 0) {
      setError('Deposit amount must be greater than zero.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/customers/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          amount: depositAmount,
          paymentMethod,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to record deposit');
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Network error. Failed to record deposit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Receive Customer Advance
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Receive Advance Deposit</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Record unearned customer cash advance</p>
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
                <label className="block text-slate-700 font-bold mb-1">Select Customer *</label>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} — Current Advance: Rs. {c.depositBalance}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deposit Amount (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="CASH">Cash (Adds to Counter Drawer)</option>
                  <option value="BANK_TRANSFER">Bank Transfer / Online</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes / Order Purpose</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Advance for custom PC build or gaming laptop booking"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Recording...' : 'Save Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
