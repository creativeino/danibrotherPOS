import React from 'react';
import { POSTerminal } from '@/features/pos/POSTerminal';
import { InventoryService } from '@/services/inventory-service';
import { AccountService } from '@/services/account-service';
import { dbStore } from '@/lib/db';

export default async function POSPage() {
  const products = InventoryService.getProducts();
  const customers = AccountService.getCustomers();
  const categories = dbStore.getState().categories;
  const settings = dbStore.getState().settings;

  return (
    <div className="h-full w-full -m-6 p-4 bg-slate-100/70">
      <POSTerminal
        initialProducts={products}
        customers={customers}
        categories={categories}
        defaultTaxRate={settings.defaultTaxRate}
        taxEnabled={settings.taxEnabled}
      />
    </div>
  );
}
