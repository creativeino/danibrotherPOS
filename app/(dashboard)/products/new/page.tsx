import React from 'react';
import { dbStore } from '@/lib/db';
import { NewProductForm } from '@/features/products/NewProductForm';

export default async function NewProductPage() {
  const state = dbStore.getState();
  const categories = state.categories.map(c => ({ id: c.id, name: c.name }));
  const brands = state.brands.map(b => ({ id: b.id, name: b.name }));
  const suppliers = (state.suppliers || []).map(s => ({
    id: s.id,
    name: s.name,
    companyName: s.companyName,
  }));

  return <NewProductForm categories={categories} brands={brands} suppliers={suppliers} />;
}
