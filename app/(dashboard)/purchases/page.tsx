import React from 'react';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDatePK } from '@/lib/calculations';
import { NewPurchaseModal } from '@/components/NewPurchaseModal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PurchasesPage() {
  const [rawPurchases, rawSuppliers, rawProducts] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
    prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const purchases = rawPurchases.map(p => ({
    id: p.id,
    purchaseNumber: p.purchaseNumber,
    supplierName: p.supplier?.name || 'Supplier',
    purchaseDate: p.purchaseDate.toISOString(),
    grandTotal: Number(p.grandTotal),
    supplierAdvanceUsed: Number(p.supplierAdvanceUsed),
    amountPaid: Number(p.amountPaid),
    remainingBalance: Number(p.remainingBalance),
    paymentStatus: p.paymentStatus,
  }));

  const suppliers = rawSuppliers.map(s => ({
    id: s.id,
    name: s.name,
    companyName: s.companyName,
  }));

  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    quantityInStock: p.quantityInStock,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchases & Goods Inwards</h1>
          <p className="text-xs text-slate-500 font-medium">
            Receive inventory shipments, record serial numbers, and update supplier bills
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewPurchaseModal suppliers={suppliers} products={products as any} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Purchase #</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-right">Advance Used</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Balance Due</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    No purchase invoices recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-blue-600 font-bold">{p.purchaseNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{p.supplierName}</td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {formatDatePK(p.purchaseDate)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(p.grandTotal)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-emerald-700">
                      {formatCurrency(p.supplierAdvanceUsed)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-700">
                      {formatCurrency(p.amountPaid)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(p.remainingBalance)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.paymentStatus}
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
