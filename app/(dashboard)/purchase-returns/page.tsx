import React from 'react';
import { prisma } from '@/lib/prisma';
import { NewPurchaseReturnModal } from '@/components/NewPurchaseReturnModal';
import { PurchaseReturnsTable } from '@/components/PurchaseReturnsTable';

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
            Return defective/damaged merchandise to suppliers, edit remarks, or delete & reverse debit notes
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

      <PurchaseReturnsTable initialReturns={returns} />
    </div>
  );
}

