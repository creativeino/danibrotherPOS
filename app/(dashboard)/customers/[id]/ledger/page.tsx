import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AccountService } from '@/services/account-service';
import { formatCurrency } from '@/lib/calculations';
import { ArrowLeft, User, Phone, Mail, MapPin } from 'lucide-react';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

export default async function CustomerLedgerPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const customers = AccountService.getCustomers();
  const customer = customers.find(c => c.id === resolvedParams.id);

  if (!customer) {
    notFound();
  }

  const ledger = AccountService.getCustomerLedger(customer.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <PrintButton
          label="Print Statement"
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition print:hidden cursor-pointer"
          iconClassName="w-3.5 h-3.5 text-blue-600"
        />
      </div>

      {/* Customer Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">
              {customer.customerNumber}
            </span>
            <span className="text-xs text-slate-400 font-medium">Customer Statement</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            {customer.phone && (
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {customer.email}
              </span>
            )}
            {customer.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {customer.address}
              </span>
            )}
          </div>
        </div>

        {/* Balance Summary */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl text-right min-w-[160px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Receivable Balance</div>
            <div className="text-xl font-mono font-black text-rose-700 mt-0.5">
              {formatCurrency(customer.outstandingBalance)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Pending to Collect</div>
          </div>
        </div>
      </div>

      {/* Ledger Entries Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Account Statement & History
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {ledger.length} {ledger.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Reference #</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Debit (Sale / Due)</th>
                <th className="p-3.5 text-right">Credit (Received)</th>
                <th className="p-3.5 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No ledger transactions recorded yet for this customer.
                  </td>
                </tr>
              ) : (
                ledger.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-slate-500">
                      {new Date(entry.entryDate).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-blue-600">{entry.reference}</td>
                    <td className="p-3.5 font-medium text-slate-800">{entry.description}</td>
                    <td className="p-3.5 text-right font-mono text-rose-700 font-bold">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-700 font-bold">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(entry.balanceAfter)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
