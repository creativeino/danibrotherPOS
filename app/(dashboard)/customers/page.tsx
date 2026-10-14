import React from 'react';
import { AccountService } from '@/services/account-service';
import { formatCurrency } from '@/lib/calculations';
import { Users, Plus, Phone, MapPin, Wallet, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { NewCustomerModal } from '@/components/NewCustomerModal';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = AccountService.getCustomers();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Accounts & Ledgers</h1>
          <p className="text-xs text-slate-500 font-medium">
            Track customer credit, outstanding receivables, and transaction statements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewCustomerModal />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5 whitespace-nowrap">Customer #</th>
                <th className="p-3.5 whitespace-nowrap">Name</th>
                <th className="p-3.5">Phone & Address</th>
                <th className="p-3.5 text-right whitespace-nowrap">Outstanding (Due)</th>
                <th className="p-3.5 text-right whitespace-nowrap">Credit Limit</th>
                <th className="p-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-mono text-blue-600 font-bold whitespace-nowrap">{c.customerNumber}</td>
                  <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{c.name}</td>
                  <td className="p-3.5 text-slate-500">
                    <div className="font-medium text-slate-700">{c.phone || 'N/A'}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.address || ''}</div>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                    {formatCurrency(c.outstandingBalance)}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-500 whitespace-nowrap">
                    {c.creditLimit > 0 ? formatCurrency(c.creditLimit) : 'No Credit'}
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href={`/customers/${c.id}/ledger`}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition"
                    >
                      Statement &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
