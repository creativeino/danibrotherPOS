import React from 'react';
import { dbStore } from '@/lib/db';
import { InvoicesTable } from '@/components/InvoicesTable';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const sales = [...dbStore.getState().sales].reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Invoices & Receipts</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage sales records, reprint thermal slips, edit invoice details, or delete & restock
          </p>
        </div>
      </div>

      <InvoicesTable invoices={sales} />
    </div>
  );
}
