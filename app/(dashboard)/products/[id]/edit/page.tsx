import React from 'react';
import { dbStore } from '@/lib/db';
import { notFound } from 'next/navigation';
import { EditProductForm } from '@/features/products/EditProductForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditProductPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const state = dbStore.getState();
  const product = state.products.find(p => p.id === resolvedParams.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <EditProductForm
        product={product}
        categories={state.categories}
        brands={state.brands}
        suppliers={state.suppliers}
      />
    </div>
  );
}
