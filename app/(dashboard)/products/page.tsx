import React from 'react';
import { InventoryService } from '@/services/inventory-service';
import { ProductsManagerTable } from '@/components/ProductsManagerTable';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const allItems = InventoryService.getProducts();

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Product Inventory & Catalog</h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Manage hardware stock, pricing, serial numbers, edit details or delete catalog items
          </p>
        </div>
      </div>

      {/* Interactive Products Table with Live Search, Tabs, Edit & Delete */}
      <ProductsManagerTable initialProducts={allItems} />
    </div>
  );
}
