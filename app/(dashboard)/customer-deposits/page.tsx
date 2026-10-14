import React from 'react';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/calculations';
import { Wallet } from 'lucide-react';
import { NewDepositModal } from '@/components/NewDepositModal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerDepositsPage() {
  const [deposits, rawCustomers] = await Promise.all([
    prisma.customerDeposit.findMany({
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const customers = rawCustomers.map(c => ({
    id: c.id,
    name: c.name,
    customerNumber: c.customerNumber,
    phone: c.phone ?? '',
    depositBalance: Number(c.depositBalance),
    outstandingBalance: Number(c.outstandingBalance),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Advance Deposits</h1>
          <p className="text-xs text-slate-500 font-medium">
            Unearned customer balances received in advance of product delivery or PC builds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewDepositModal customers={customers} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Receipt #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5 text-right">Amount Deposited</th>
                <th className="p-3.5 text-center">Payment Method</th>
                <th className="p-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No advance deposits recorded yet.
                  </td>
                </tr>
              ) : (
                deposits.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-emerald-700 font-bold">{d.receiptNumber}</td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(d.createdAt).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{d.customer?.name || 'Walk-in'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(Number(d.amount))}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {d.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">{d.notes || '—'}</td>
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
