import React from 'react';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/calculations';
import { NewExpenseModal } from '@/components/NewExpenseModal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ExpensesPage() {
  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      include: {
        category: true,
        creator: true,
      },
      orderBy: { expenseDate: 'desc' },
    }),
    prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shop Operating Expenses</h1>
          <p className="text-xs text-slate-500 font-medium">
            Track rent, electricity, fuel, staff wages, and daily shop overheads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewExpenseModal categories={categories} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Expense #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Expense Category</th>
                <th className="p-3.5">Title / Notes</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No operating expenses logged yet.
                  </td>
                </tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-purple-600 font-bold">{e.expenseNumber}</td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(e.expenseDate).toLocaleDateString('en-PK')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{e.category?.name || 'General'}</td>
                    <td className="p-3.5 text-slate-600">{e.title}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(Number(e.amount))}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {e.paymentMethod}
                      </span>
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
