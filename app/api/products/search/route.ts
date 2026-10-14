import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { modelNumber: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: { brand: true, category: true },
    orderBy: { name: 'asc' },
    take: 50,
  });

  const mapped = products.map(p => ({
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
    isService: p.sku.startsWith('SRV') || p.category?.slug === 'it-services-repairs',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return NextResponse.json({ products: mapped });
}
