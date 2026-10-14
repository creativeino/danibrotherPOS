import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> | { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const resolvedParams = await Promise.resolve(params);
    const returnId = resolvedParams.id;
    const body = await req.json();

    const existingReturn = await prisma.salesReturn.findUnique({
      where: { id: returnId },
    });

    if (!existingReturn) {
      return NextResponse.json({ success: false, error: 'Sales return not found' }, { status: 404 });
    }

    const { reason, refundMethod } = body;

    const updated = await prisma.salesReturn.update({
      where: { id: returnId },
      data: {
        reason: reason !== undefined ? reason : existingReturn.reason,
        refundMethod: refundMethod || existingReturn.refundMethod,
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SALE_RETURN_EDITED',
          entityType: 'SalesReturn',
          entityId: returnId,
          details: JSON.stringify({
            returnNumber: existingReturn.returnNumber,
            reason,
            refundMethod,
          }),
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, returnRecord: updated });
  } catch (error: any) {
    console.error('Error updating sales return:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const resolvedParams = await Promise.resolve(params);
    const returnId = resolvedParams.id;

    const existingReturn = await prisma.salesReturn.findUnique({
      where: { id: returnId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        salesInvoice: true,
        customer: true,
      },
    });

    if (!existingReturn) {
      return NextResponse.json({ success: false, error: 'Sales return not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Revert each item
      for (const item of existingReturn.items) {
        // 1. Revert returnedQuantity on salesInvoiceItem
        if (item.salesInvoiceItemId) {
          await tx.salesInvoiceItem.update({
            where: { id: item.salesInvoiceItemId },
            data: {
              returnedQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        // 2. If it was restocked into inventory, deduct it back out
        if (item.condition === 'RESTOCKABLE') {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            const prevStock = product.quantityInStock;
            const newStock = Math.max(0, prevStock - item.quantity);

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
                quantityChange: -item.quantity,
                previousStock: prevStock,
                newStock: newStock,
                unitCost: Number(item.unitCost),
                referenceType: 'SALES_RETURN_REVERSAL',
                referenceId: existingReturn.returnNumber,
                reason: `Sales return deleted/reversed: ${existingReturn.returnNumber}`,
                performedById: userId,
              },
            });
          }

          // If serial was returned, mark it as SOLD back to invoice
          if (item.serialNumber) {
            const serialRecord = await tx.productSerialNumber.findFirst({
              where: {
                productId: item.productId,
                serialNumber: item.serialNumber,
              },
            });

            if (serialRecord) {
              await tx.productSerialNumber.update({
                where: { id: serialRecord.id },
                data: {
                  status: 'SOLD',
                  salesInvoiceId: existingReturn.salesInvoiceId,
                },
              });
            }
          }
        }
      }

      // 3. Revert customer credit if refundMethod was CUSTOMER_CREDIT
      if (existingReturn.refundMethod === 'CUSTOMER_CREDIT' && existingReturn.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: existingReturn.customerId },
        });

        if (customer) {
          const refundAmt = Number(existingReturn.refundAmount);
          const newDeposit = Math.max(0, Number(customer.depositBalance) - refundAmt);

          await tx.customer.update({
            where: { id: customer.id },
            data: {
              depositBalance: newDeposit,
              updatedAt: new Date(),
            },
          });

          await tx.customerLedgerEntry.create({
            data: {
              customerId: customer.id,
              entryDate: new Date(),
              reference: `REV-${existingReturn.returnNumber}`,
              description: `Sales Return Cancellation Reversal (${existingReturn.returnNumber})`,
              debit: refundAmt,
              credit: 0,
              balanceAfter: customer.outstandingBalance,
            },
          });
        }
      }

      // 4. Delete the SalesReturn (cascade deletes SalesReturnItem)
      await tx.salesReturn.delete({
        where: { id: returnId },
      });

      // 5. Audit Log
      try {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'SALE_RETURN_DELETED',
            entityType: 'SalesReturn',
            entityId: returnId,
            details: JSON.stringify({
              returnNumber: existingReturn.returnNumber,
              refundAmount: Number(existingReturn.refundAmount),
            }),
          },
        });
      } catch {
        // ignore
      }
    });

    return NextResponse.json({ success: true, message: 'Sales return successfully deleted and reversed' });
  } catch (error: any) {
    console.error('Error deleting sales return:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
