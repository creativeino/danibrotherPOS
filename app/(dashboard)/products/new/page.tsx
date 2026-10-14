import React from 'react';
import { prisma } from '@/lib/prisma';
import { NewProductForm } from '@/features/products/NewProductForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewProductPage() {
  const [categories, brands, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <NewProductForm
      categories={categories.map(c => ({ id: c.id, name: c.name }))}
      brands={brands.map(b => ({ id: b.id, name: b.name }))}
      suppliers={suppliers.map(s => ({
        id: s.id,
        name: s.name,
        companyName: s.companyName,
      }))}
    />
  );
}
