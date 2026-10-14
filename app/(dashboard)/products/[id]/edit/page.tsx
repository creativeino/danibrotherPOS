import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditProductForm } from '@/features/products/EditProductForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditProductPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);

  const [rawProduct, categories, brands, suppliers] = await Promise.all([
    prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: { brand: true, category: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!rawProduct) {
    notFound();
  }

  const product = {
    ...rawProduct,
    costPrice: Number(rawProduct.costPrice),
    sellingPrice: Number(rawProduct.sellingPrice),
    wholesalePrice: rawProduct.wholesalePrice ? Number(rawProduct.wholesalePrice) : null,
    minSellingPrice: rawProduct.minSellingPrice ? Number(rawProduct.minSellingPrice) : null,
    taxRatePercent: Number(rawProduct.taxRatePercent),
    brandName: rawProduct.brand?.name ?? null,
    categoryName: rawProduct.category?.name ?? null,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <EditProductForm
        product={product as any}
        categories={categories as any}
        brands={brands as any}
        suppliers={suppliers as any}
      />
    </div>
  );
}
