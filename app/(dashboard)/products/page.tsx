import React from 'react';
import { prisma } from '@/lib/prisma';
import { ProductsManagerTable } from '@/components/ProductsManagerTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      brand: true,
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const allItems = products.map(p => ({
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
    unit: p.unit,
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
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Product Inventory & Catalog</h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Manage hardware stock, pricing, serial numbers, edit details or delete catalog items
          </p>
        </div>
      </div>

      <ProductsManagerTable initialProducts={allItems as any} />
    </div>
  );
}
