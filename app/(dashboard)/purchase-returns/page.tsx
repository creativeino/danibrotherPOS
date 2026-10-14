import React from 'react';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/calculations';
import { NewPurchaseReturnModal } from '@/components/NewPurchaseReturnModal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PurchaseReturnsPage() {
  const [rawReturns, rawSuppliers, rawProducts, rawInvoices] = await Promise.all([
    prisma.purchaseReturn.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        purchaseInvoice: true,
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
    prisma.purchaseInvoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        purchaseNumber: true,
        supplierId: true,
      },
    }),
  ]);

  const returns = rawReturns.map(r => ({
    id: r.id,
    returnNumber: r.returnNumber,
    purchaseNumber: r.purchaseInvoice?.purchaseNumber || null,
    supplierName: r.supplier?.name || 'Supplier',
    returnDate: r.returnDate.toISOString(),
    totalAmount: Number(r.totalAmount),
    reason: r.reason || '',
    items: r.items.map(i => ({
      id: i.id,
      productName: i.product?.name || 'Product',
      quantity: i.quantity,
      unitCost: Number(i.unitCost),
      totalCost: Number(i.totalCost),
    })),
  }));

  const suppliers = rawSuppliers.map(s => ({
    id: s.id,
    name: s.name,
    companyName: s.companyName,
    outstandingBalance: Number(s.outstandingBalance),
  }));

  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    costPrice: Number(p.costPrice),
    quantityInStock: p.quantityInStock,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Returns & Debit Notes</h1>
          <p className="text-xs text-slate-500 font-medium">
            Return defective/damaged merchandise to suppliers, reduce payables, and restock adjustments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewPurchaseReturnModal
            suppliers={suppliers}
            products={products}
            purchaseInvoices={rawInvoices}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Debit Note #</th>
                <th className="p-3.5">Supplier / Vendor</th>
                <th className="p-3.5">Invoice Ref</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Returned Items</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5 text-right">Debit Note Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No purchase returns recorded yet.
                  </td>
                </tr>
              ) : (
                returns.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono text-amber-600 font-bold">{r.returnNumber}</td>
                    <td className="p-3.5 font-bold text-slate-900">{r.supplierName}</td>
                    <td className="p-3.5 font-mono text-blue-600">
                      {r.purchaseNumber || '—'}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(r.returnDate).toLocaleDateString('en-PK')}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {r.items.map(item => (
                        <div key={item.id} className="text-[11px]">
                          <span className="font-semibold">{item.productName}</span> ({item.quantity} pcs @ {formatCurrency(item.unitCost)})
                        </div>
                      ))}
                    </td>
                    <td className="p-3.5 text-slate-600">{r.reason}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(r.totalAmount)}
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
