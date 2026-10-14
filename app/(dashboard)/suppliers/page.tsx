import React from 'react';
import { prisma } from '@/lib/prisma';
import { NewSupplierModal } from '@/components/NewSupplierModal';
import { PaySupplierModal } from '@/components/PaySupplierModal';
import { NewPurchaseReturnModal } from '@/components/NewPurchaseReturnModal';
import { SuppliersManagerTable } from '@/components/SuppliersManagerTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuppliersPage() {
  const [rawSuppliers, rawProducts] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    costPrice: Number(p.costPrice),
    quantityInStock: p.quantityInStock,
  }));

  const suppliers = rawSuppliers.map(s => ({
    id: s.id,
    supplierNumber: s.supplierNumber,
    name: s.name,
    companyName: s.companyName,
    phone: s.phone,
    email: s.email,
    address: s.address,
    openingBalance: Number(s.openingBalance),
    advanceBalance: Number(s.advanceBalance),
    outstandingBalance: Number(s.outstandingBalance),
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suppliers & Distributors</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage product suppliers, distributor bills, edit details, and payable balances
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <NewPurchaseReturnModal
            suppliers={suppliers.map(s => ({
              id: s.id,
              name: s.name,
              companyName: s.companyName,
              outstandingBalance: s.outstandingBalance,
            }))}
            products={products.map(p => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              costPrice: Number(p.costPrice),
              quantityInStock: p.quantityInStock,
            }))}
          />
          <PaySupplierModal
            allSuppliers={suppliers.map(s => ({ id: s.id, name: s.name, outstandingBalance: s.outstandingBalance }))}
            buttonLabel="Pay Supplier Bill"
          />
          <NewSupplierModal />
        </div>
      </div>

      <SuppliersManagerTable initialSuppliers={suppliers as any} />
    </div>
  );
}
