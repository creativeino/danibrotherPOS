import React from 'react';
import { dbStore } from '@/lib/db';
import { formatCurrency } from '@/lib/calculations';
import { NewReturnModal } from '@/components/NewReturnModal';

export const dynamic = 'force-dynamic';

export default async function SalesReturnsPage() {
  const state = dbStore.getState();
  const returns = [...state.salesReturns].reverse();

  // Attach items to active non-voided sales for the modal
  const salesWithItems = state.sales
    .filter(s => !s.isVoided)
    .map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName,
      invoiceDate: s.invoiceDate,
      items: state.saleItems.filter(item => item.salesInvoiceId === s.id),
    }))
    .reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Returns & Refunds</h1>
          <p className="text-xs text-slate-500 font-medium">
            Process returned merchandise, restock sellable units, and track refund disbursements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewReturnModal invoices={salesWithItems} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No sales returns recorded yet.
                  </td>
                </tr>
              ) : (
                returns.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-rose-600 font-bold">{r.returnNumber}</td>
                    <td className="p-3.5 font-mono text-blue-600 font-semibold">
                      {r.invoiceNumber || r.salesInvoiceId}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{r.customerName || 'Customer'}</td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(r.returnDate).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3.5 text-slate-600">{r.reason || 'Customer request'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(r.refundAmount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {r.refundMethod}
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
