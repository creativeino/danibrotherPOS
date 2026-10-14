import React from 'react';
import { prisma } from '@/lib/prisma';
import { BarcodeLabelGrid } from '@/components/BarcodeLabelGrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BarcodesPage() {
  const rawProducts = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  const products = rawProducts.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    costPrice: Number(p.costPrice),
    sellingPrice: Number(p.sellingPrice),
    quantityInStock: p.quantityInStock,
    unit: p.unit,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Barcode & QR Label Generator</h1>
          <p className="text-xs text-slate-500 font-medium">
            Generate Code 128 barcodes and QR codes for retail price tags and shelf labels
          </p>
        </div>
      </div>

      <BarcodeLabelGrid products={products as any} />
    </div>
  );
}
