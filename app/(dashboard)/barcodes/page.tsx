import React from 'react';
import { InventoryService } from '@/services/inventory-service';
import { BarcodeLabelGrid } from '@/components/BarcodeLabelGrid';

export const dynamic = 'force-dynamic';

export default async function BarcodesPage() {
  const products = InventoryService.getProducts();

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

      <BarcodeLabelGrid products={products} />
    </div>
  );
}
