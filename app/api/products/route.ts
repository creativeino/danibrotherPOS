import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');

    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(categoryId ? { categoryId } : {}),
        ...(brandId ? { brandId } : {}),
      },
      include: {
        brand: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
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
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ success: true, products: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';

    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid product data' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check SKU or Barcode conflicts
    const conflict = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: data.sku },
          { barcode: data.barcode },
        ],
      },
    });

    if (conflict) {
      const field = conflict.sku === data.sku ? 'SKU' : 'Barcode';
      return NextResponse.json(
        { success: false, error: `A product with this ${field} already exists.` },
        { status: 400 }
      );
    }

    const created = await prisma.product.create({
      data: {
        name: data.name.trim(),
        sku: data.sku.trim(),
        barcode: data.barcode.trim(),
        brandId: data.brandId || null,
        categoryId: data.categoryId || null,
        modelNumber: data.modelNumber?.trim() || null,
        description: data.description?.trim() || null,
        unit: data.unit,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice ?? null,
        minSellingPrice: data.minSellingPrice ?? null,
        quantityInStock: data.quantityInStock,
        reorderLevel: data.reorderLevel,
        requiresSerial: data.requiresSerial,
        warrantyDurationMonths: data.warrantyDurationMonths,
        taxRatePercent: data.taxRatePercent,
        active: data.active,
      },
      include: {
        brand: true,
        category: true,
      },
    });

    // Record initial inventory movement if quantity > 0
    if (data.quantityInStock > 0) {
      try {
        await prisma.inventoryMovement.create({
          data: {
            productId: created.id,
            movementType: 'OPENING_STOCK',
            quantityChange: data.quantityInStock,
            previousStock: 0,
            newStock: data.quantityInStock,
            unitCost: data.costPrice,
            referenceType: 'MANUAL',
            reason: 'Initial stock on product creation',
            performedById: userId,
          },
        });
      } catch {
        // ignore movement logging failure
      }

      // If a supplier was selected, add the initial stock value to the supplier's payable balance
      if (data.supplierId) {
        try {
          const supplier = await prisma.supplier.findUnique({
            where: { id: data.supplierId },
          });

          if (supplier) {
            const stockCostTotal = Number(data.costPrice) * Number(data.quantityInStock);
            if (stockCostTotal > 0) {
              const newBalance = Number(supplier.outstandingBalance) + stockCostTotal;

              await prisma.supplier.update({
                where: { id: supplier.id },
                data: {
                  outstandingBalance: newBalance,
                  updatedAt: new Date(),
                },
              });

              await prisma.supplierLedgerEntry.create({
                data: {
                  supplierId: supplier.id,
                  entryDate: new Date(),
                  reference: `PRD-${created.sku}`,
                  description: `Initial Stock Inwards: ${created.name} (${data.quantityInStock} pcs @ Rs. ${data.costPrice})`,
                  debit: 0,
                  credit: stockCostTotal,
                  balanceAfter: newBalance,
                },
              });
            }
          }
        } catch (supErr) {
          console.error('Failed to link supplier stock balance:', supErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        ...created,
        costPrice: Number(created.costPrice),
        sellingPrice: Number(created.sellingPrice),
        wholesalePrice: created.wholesalePrice ? Number(created.wholesalePrice) : null,
        minSellingPrice: created.minSellingPrice ? Number(created.minSellingPrice) : null,
        taxRatePercent: Number(created.taxRatePercent),
        brandName: created.brand?.name ?? null,
        categoryName: created.category?.name ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
