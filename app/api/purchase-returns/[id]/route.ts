import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { roundToCents } from '@/lib/calculations';

type Params = { params: Promise<{ id: string }> | { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const resolvedParams = await Promise.resolve(params);
    const returnId = resolvedParams.id;
    const body = await req.json();

    const existingReturn = await prisma.purchaseReturn.findUnique({
      where: { id: returnId },
    });

    if (!existingReturn) {
      return NextResponse.json({ success: false, error: 'Purchase return not found' }, { status: 404 });
    }

    const { reason } = body;

    const updated = await prisma.purchaseReturn.update({
      where: { id: returnId },
      data: {
        reason: reason !== undefined ? reason : existingReturn.reason,
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PURCHASE_RETURN_EDITED',
          entityType: 'PurchaseReturn',
          entityId: returnId,
          details: JSON.stringify({
            returnNumber: existingReturn.returnNumber,
            reason,
          }),
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, returnRecord: updated });
  } catch (error: any) {
    console.error('Error updating purchase return:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const resolvedParams = await Promise.resolve(params);
    const returnId = resolvedParams.id;

    const existingReturn = await prisma.purchaseReturn.findUnique({
      where: { id: returnId },
      include: {
        items: true,
        supplier: true,
      },
    });

    if (!existingReturn) {
      return NextResponse.json({ success: false, error: 'Purchase return not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Re-add items back into stock
      for (const item of existingReturn.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const prevStock = product.quantityInStock;
          const newStock = prevStock + item.quantity;

          await tx.product.update({
            where: { id: product.id },
            data: {
              quantityInStock: newStock,
              updatedAt: new Date(),
            },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              movementType: 'MANUAL_ADJUSTMENT',
              quantityChange: item.quantity,
              previousStock: prevStock,
              newStock: newStock,
              unitCost: Number(item.unitCost),
              referenceType: 'PURCHASE_RETURN_REVERSAL',
              referenceId: existingReturn.returnNumber,
              reason: `Purchase return deleted/reversed: ${existingReturn.returnNumber}`,
              performedById: userId,
            },
          });
        }
      }

      // 2. Re-add supplier outstanding payables liability
      const supplier = await tx.supplier.findUnique({
        where: { id: existingReturn.supplierId },
      });

      if (supplier) {
        const returnAmt = Number(existingReturn.totalAmount);
        const newOutstanding = roundToCents(Number(supplier.outstandingBalance) + returnAmt);

        await tx.supplier.update({
          where: { id: supplier.id },
          data: {
            outstandingBalance: newOutstanding,
            updatedAt: new Date(),
          },
        });

        await tx.supplierLedgerEntry.create({
          data: {
            supplierId: supplier.id,
            entryDate: new Date(),
            reference: `REV-${existingReturn.returnNumber}`,
            description: `Purchase Return Cancellation Reversal (${existingReturn.returnNumber})`,
            debit: 0,
            credit: returnAmt, // Credit increases supplier payable
            balanceAfter: newOutstanding,
          },
        });
      }

      // 3. Delete PurchaseReturn (cascades items)
      await tx.purchaseReturn.delete({
        where: { id: returnId },
      });

      // 4. Audit Log
      try {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'PURCHASE_RETURN_DELETED',
            entityType: 'PurchaseReturn',
            entityId: returnId,
            details: JSON.stringify({
              returnNumber: existingReturn.returnNumber,
              totalAmount: Number(existingReturn.totalAmount),
            }),
          },
        });
      } catch {
        // ignore
      }
    });

    return NextResponse.json({ success: true, message: 'Purchase return successfully deleted and reversed' });
  } catch (error: any) {
    console.error('Error deleting purchase return:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
