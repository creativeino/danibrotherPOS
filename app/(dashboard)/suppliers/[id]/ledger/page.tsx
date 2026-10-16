import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDateTimePK } from '@/lib/calculations';
import { ArrowLeft, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { PrintButton } from '@/components/PrintButton';
import { PaySupplierModal } from '@/components/PaySupplierModal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

export default async function SupplierLedgerPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);

  const supplier = await prisma.supplier.findUnique({
    where: { id: resolvedParams.id },
    include: {
      ledgerEntries: {
        orderBy: { entryDate: 'desc' },
      },
    },
  });

  if (!supplier) {
    notFound();
  }

  const mappedSupplier = {
    ...supplier,
    openingBalance: Number(supplier.openingBalance),
    advanceBalance: Number(supplier.advanceBalance),
    outstandingBalance: Number(supplier.outstandingBalance),
  };

  const ledger = supplier.ledgerEntries.map(e => ({
    id: e.id,
    entryDate: e.entryDate.toISOString(),
    reference: e.reference,
    description: e.description,
    debit: Number(e.debit),
    credit: Number(e.credit),
    balanceAfter: Number(e.balanceAfter),
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          href="/suppliers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Suppliers
        </Link>
        <div className="flex items-center gap-2">
          <PaySupplierModal
            supplier={{ id: mappedSupplier.id, name: mappedSupplier.name, outstandingBalance: mappedSupplier.outstandingBalance }}
            buttonLabel="Pay Supplier"
            buttonClassName="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition print:hidden cursor-pointer"
          />
          <PrintButton
            label="Print Statement"
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition print:hidden cursor-pointer"
            iconClassName="w-3.5 h-3.5 text-purple-600"
          />
        </div>
      </div>

      {/* Supplier Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-purple-600 px-2 py-0.5 bg-purple-50 rounded-md border border-purple-100">
              {mappedSupplier.supplierNumber}
            </span>
            <span className="text-xs text-slate-400 font-medium">Distributor Statement</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{mappedSupplier.name}</h1>
          {mappedSupplier.companyName && (
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {mappedSupplier.companyName}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            {mappedSupplier.phone && (
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-slate-400" /> {mappedSupplier.phone}
              </span>
            )}
            {mappedSupplier.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {mappedSupplier.email}
              </span>
            )}
            {mappedSupplier.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {mappedSupplier.address}
              </span>
            )}
          </div>
        </div>

        {/* Balance Summary */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl text-right min-w-[160px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Payable Balance</div>
            <div className="text-xl font-mono font-black text-rose-700 mt-0.5">
              {formatCurrency(mappedSupplier.outstandingBalance)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Pending to Pay</div>
          </div>
        </div>
      </div>

      {/* Ledger Entries Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Account Activity & Statement History
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
                <th className="p-3.5 text-right">Debit (Payment)</th>
                <th className="p-3.5 text-right">Credit (Purchase)</th>
                <th className="p-3.5 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No ledger transactions recorded yet for this supplier.
                  </td>
                </tr>
              ) : (
                ledger.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-slate-500">
                      {formatDateTimePK(entry.entryDate)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-purple-600">{entry.reference}</td>
                    <td className="p-3.5 font-medium text-slate-800">{entry.description}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-700 font-bold">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-mono text-rose-700 font-bold">
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
