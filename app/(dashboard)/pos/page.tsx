import React from 'react';
import { POSTerminal } from '@/features/pos/POSTerminal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const [rawProducts, rawCustomers, rawCategories, settings] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: { brand: true, category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.shopSettings.findFirst(),
  ]);

  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    brandId: p.brandId,
    brandName: p.brand?.name ?? null,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    modelNumber: p.modelNumber ?? null,
    description: p.description ?? null,
    unit: p.unit as string,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
    minSellingPrice: p.minSellingPrice ? Number(p.minSellingPrice) : null,
    quantityInStock: p.quantityInStock,
    reorderLevel: p.reorderLevel,
    requiresSerial: p.requiresSerial,
    warrantyDurationMonths: p.warrantyDurationMonths,
    taxRatePercent: Number(p.taxRatePercent),
    active: p.active,
    isService: p.unit === 'PIECE' && p.quantityInStock === 0 && p.sku.startsWith('SRV') ? true : false,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const customers = rawCustomers.map(c => ({
    id: c.id,
    customerNumber: c.customerNumber,
    name: c.name,
    phone: c.phone ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    creditLimit: Number(c.creditLimit),
    depositBalance: Number(c.depositBalance),
    outstandingBalance: Number(c.outstandingBalance),
    createdAt: c.createdAt.toISOString(),
  }));

  const categories = rawCategories.map(c => ({ id: c.id, name: c.name }));

  return (
    <div className="h-full w-full -m-3 sm:-m-5 lg:-m-6 p-2 sm:p-4 bg-slate-100/70">
      <POSTerminal
        initialProducts={products as any}
        customers={customers as any}
        categories={categories}
        defaultTaxRate={settings?.defaultTaxRate ? Number(settings.defaultTaxRate) : 0}
        taxEnabled={settings?.taxEnabled ?? false}
      />
    </div>
  );
}
