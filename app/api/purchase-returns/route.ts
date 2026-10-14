import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { roundToCents } from '@/lib/calculations';
import { z } from 'zod';

const purchaseReturnSchema = z.object({
  purchaseInvoiceId: z.string().nullable().optional(),
  supplierId: z.string().min(1, 'Supplier is required'),
  reason: z.string().min(2, 'Return reason is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitCost: z.number().min(0, 'Unit cost cannot be negative'),
    notes: z.string().nullable().optional(),
  })).min(1, 'At least one item must be returned'),
});

export async function GET() {
  try {
    const returns = await prisma.purchaseReturn.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        purchaseInvoice: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const mapped = returns.map(r => ({
      id: r.id,
      returnNumber: r.returnNumber,
      purchaseInvoiceId: r.purchaseInvoiceId,
      purchaseNumber: r.purchaseInvoice?.purchaseNumber || null,
      supplierId: r.supplierId,
      supplierName: r.supplier?.name || 'Supplier',
      totalAmount: Number(r.totalAmount),
      reason: r.reason || '',
      returnDate: r.returnDate.toISOString(),
      items: r.items.map(i => ({
        id: i.id,
        productId: i.productId,
        productName: i.product?.name || 'Product',
        quantity: i.quantity,
        unitCost: Number(i.unitCost),
        totalCost: Number(i.totalCost),
        notes: i.notes,
      })),
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, returns: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';

    const body = await req.json();
    const parsed = purchaseReturnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid return data' },
        { status: 400 }
      );
    }

    const { purchaseInvoiceId, supplierId, reason, items } = parsed.data;

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    const count = await prisma.purchaseReturn.count();
    const returnNumber = `PRT-${String(count + 1).padStart(5, '0')}`;

    const purchaseReturn = await prisma.$transaction(async (tx) => {
      let totalReturnAmount = 0;
      const returnItemsData: any[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.quantityInStock < item.quantity) {
          throw new Error(
            `Cannot return ${item.quantity} units of "${product.name}". Only ${product.quantityInStock} units available in stock.`
          );
        }

        const itemTotal = roundToCents(item.quantity * item.unitCost);
        totalReturnAmount = roundToCents(totalReturnAmount + itemTotal);

        const prevStock = product.quantityInStock;
        const newStock = prevStock - item.quantity;

        // Deduct inventory stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantityInStock: newStock,
            updatedAt: new Date(),
          },
        });

        // Record Inventory Movement
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            movementType: 'PURCHASE_RETURN',
            quantityChange: -item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            unitCost: item.unitCost,
            referenceType: 'PURCHASE_RETURN',
            referenceId: returnNumber,
            reason: `Returned to supplier: ${reason}`,
            performedById: userId,
          },
        });

        returnItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: itemTotal,
          notes: item.notes || null,
        });
      }

      // Deduct returned value from supplier outstanding payables
      const currentOutstanding = Number(supplier.outstandingBalance);
      const newOutstanding = roundToCents(Math.max(0, currentOutstanding - totalReturnAmount));

      await tx.supplier.update({
        where: { id: supplier.id },
        data: {
          outstandingBalance: newOutstanding,
          updatedAt: new Date(),
        },
      });

      // Post Debit Entry to Supplier Ledger (reduces supplier payable liability)
      await tx.supplierLedgerEntry.create({
        data: {
          supplierId: supplier.id,
          entryDate: new Date(),
          reference: returnNumber,
          description: `Purchase Debit Note / Return: ${reason}`,
          debit: totalReturnAmount, // Debit reduces supplier balance
          credit: 0,
          balanceAfter: newOutstanding,
        },
      });

      // Create PurchaseReturn record
      const createdReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          supplierId: supplier.id,
          purchaseInvoiceId: purchaseInvoiceId || null,
          totalAmount: totalReturnAmount,
          reason,
          items: {
            create: returnItemsData,
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      return createdReturn;
    });

    return NextResponse.json({ success: true, returnRecord: purchaseReturn });
  } catch (error: any) {
    console.error('Purchase return error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
