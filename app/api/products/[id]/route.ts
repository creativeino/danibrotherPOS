import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> | { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const product = await prisma.product.findUnique({
      where: { id: resolvedParams.id },
      include: { brand: true, category: true },
    });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      product: {
        ...product,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
        minSellingPrice: product.minSellingPrice ? Number(product.minSellingPrice) : null,
        taxRatePercent: Number(product.taxRatePercent),
        brandName: product.brand?.name ?? null,
        categoryName: product.category?.name ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const existing = await prisma.product.findUnique({ where: { id: resolvedParams.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.sku !== undefined) updateData.sku = body.sku.trim();
    if (body.barcode !== undefined) updateData.barcode = body.barcode.trim();
    if (body.brandId !== undefined) updateData.brandId = body.brandId || null;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null;
    if (body.modelNumber !== undefined) updateData.modelNumber = body.modelNumber?.trim() || null;
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.costPrice !== undefined) updateData.costPrice = Number(body.costPrice);
    if (body.sellingPrice !== undefined) updateData.sellingPrice = Number(body.sellingPrice);
    if (body.wholesalePrice !== undefined) updateData.wholesalePrice = body.wholesalePrice ? Number(body.wholesalePrice) : null;
    if (body.minSellingPrice !== undefined) updateData.minSellingPrice = body.minSellingPrice ? Number(body.minSellingPrice) : null;
    if (body.quantityInStock !== undefined) updateData.quantityInStock = Number(body.quantityInStock);
    if (body.reorderLevel !== undefined) updateData.reorderLevel = Number(body.reorderLevel);
    if (body.requiresSerial !== undefined) updateData.requiresSerial = Boolean(body.requiresSerial);
    if (body.warrantyDurationMonths !== undefined) updateData.warrantyDurationMonths = Number(body.warrantyDurationMonths);
    if (body.taxRatePercent !== undefined) updateData.taxRatePercent = Number(body.taxRatePercent);
    if (body.active !== undefined) updateData.active = Boolean(body.active);

    const updated = await prisma.product.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: { brand: true, category: true },
    });

    return NextResponse.json({
      success: true,
      product: {
        ...updated,
        costPrice: Number(updated.costPrice),
        sellingPrice: Number(updated.sellingPrice),
        wholesalePrice: updated.wholesalePrice ? Number(updated.wholesalePrice) : null,
        minSellingPrice: updated.minSellingPrice ? Number(updated.minSellingPrice) : null,
        taxRatePercent: Number(updated.taxRatePercent),
        brandName: updated.brand?.name ?? null,
        categoryName: updated.category?.name ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const resolvedParams = await Promise.resolve(params);

    await prisma.product.update({
      where: { id: resolvedParams.id },
      data: { active: false, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
