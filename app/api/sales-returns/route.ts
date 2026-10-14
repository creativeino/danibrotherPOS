import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { roundToCents } from '@/lib/calculations';
import { salesReturnSchema } from '@/lib/validations';

export async function GET() {
  try {
    const returns = await prisma.salesReturn.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        salesInvoice: true,
        customer: true,
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
      salesInvoiceId: r.salesInvoiceId,
      invoiceNumber: r.salesInvoice?.invoiceNumber || '',
      customerId: r.customerId,
      customerName: r.customer?.name || r.salesInvoice?.customerName || 'Customer',
      refundAmount: Number(r.refundAmount),
      refundMethod: r.refundMethod,
      reason: r.reason || '',
      returnDate: r.returnDate.toISOString(),
      items: r.items.map(item => ({
        id: item.id,
        salesInvoiceItemId: item.salesInvoiceItemId,
        productId: item.productId,
        productName: item.product?.name || 'Product',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        unitCost: Number(item.unitCost),
        refundTotal: Number(item.refundTotal),
        condition: item.condition,
        serialNumber: item.serialNumber,
      })),
    }));

    return NextResponse.json({
      success: true,
      returns: mapped,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const body = await req.json();

    const parsed = salesReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid return data' },
        { status: 400 }
      );
    }

    const { salesInvoiceId, refundMethod, reason, items } = parsed.data;

    // Fetch the original sales invoice with items
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        OR: [
          { id: salesInvoiceId },
          { invoiceNumber: salesInvoiceId },
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Original sales invoice not found' }, { status: 404 });
    }

    // Generate Return Number
    const count = await prisma.salesReturn.count();
    const returnNumber = `RET-${String(count + 1).padStart(5, '0')}`;

    // Execute in PostgreSQL Transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalRefundAmount = 0;
      const returnItemsData: any[] = [];

      for (const retItem of items) {
        const saleItem = invoice.items.find(
          si => si.id === retItem.salesInvoiceItemId || si.productId === retItem.productId
        );

        if (!saleItem) {
          throw new Error(`Item not found on invoice: ${retItem.productId}`);
        }

        const remainingReturnable = saleItem.quantity - saleItem.returnedQuantity;
        if (retItem.quantity > remainingReturnable) {
          throw new Error(
            `Return quantity (${retItem.quantity}) exceeds remaining returnable quantity for "${saleItem.product?.name || 'Item'}"`
          );
        }

        const itemUnitPrice = Number(saleItem.unitPrice);
        const itemRefund = roundToCents(retItem.quantity * itemUnitPrice);
        totalRefundAmount = roundToCents(totalRefundAmount + itemRefund);

        // Update returned quantity on the sales invoice item
        await tx.salesInvoiceItem.update({
          where: { id: saleItem.id },
          data: {
            returnedQuantity: saleItem.returnedQuantity + retItem.quantity,
          },
        });

        // Restock physical inventory if restockable
        if (retItem.condition === 'RESTOCKABLE') {
          const product = await tx.product.findUnique({
            where: { id: retItem.productId },
          });

          if (product) {
            const previousStock = product.quantityInStock;
            const newStock = previousStock + retItem.quantity;

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
                movementType: 'SALE_RETURN',
                quantityChange: retItem.quantity,
                previousStock,
                newStock,
                unitCost: product.costPrice,
                referenceType: 'RETURN',
                referenceId: returnNumber,
                reason: `Restocked via Sales Return ${returnNumber} from Invoice ${invoice.invoiceNumber}`,
                performedById: userId,
              },
            });

            // If serial number supplied, update serial status
            if (retItem.serialNumber) {
              const serialRecord = await tx.productSerialNumber.findFirst({
                where: {
                  productId: product.id,
                  serialNumber: retItem.serialNumber,
                },
              });

              if (serialRecord) {
                await tx.productSerialNumber.update({
                  where: { id: serialRecord.id },
                  data: {
                    status: 'AVAILABLE',
                    salesInvoiceId: null,
                    sellingPrice: null,
                  },
                });
              }
            }
          }
        }

        returnItemsData.push({
          salesInvoiceItemId: saleItem.id,
          productId: retItem.productId,
          quantity: retItem.quantity,
          unitPrice: itemUnitPrice,
          unitCost: Number(saleItem.product?.costPrice || 0),
          refundTotal: itemRefund,
          condition: retItem.condition,
          serialNumber: retItem.serialNumber || null,
        });
      }

      // Handle Customer Credit balance if refundMethod is CUSTOMER_CREDIT
      if (refundMethod === 'CUSTOMER_CREDIT' && invoice.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: invoice.customerId },
        });

        if (customer) {
          const newDeposit = Number(customer.depositBalance) + totalRefundAmount;
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
              reference: returnNumber,
              description: `Sales Return Refund Credit (${invoice.invoiceNumber})`,
              debit: 0,
              credit: totalRefundAmount,
              balanceAfter: customer.outstandingBalance,
            },
          });
        }
      }

      // Create SalesReturn record
      const salesReturn = await tx.salesReturn.create({
        data: {
          returnNumber,
          salesInvoiceId: invoice.id,
          customerId: invoice.customerId,
          refundAmount: totalRefundAmount,
          refundMethod,
          reason,
          items: {
            create: returnItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Audit Log
      try {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'SALE_RETURN_PROCESSED',
            entityType: 'SalesReturn',
            entityId: salesReturn.id,
            details: JSON.stringify({
              returnNumber,
              invoiceNumber: invoice.invoiceNumber,
              refundAmount: totalRefundAmount,
              refundMethod,
            }),
          },
        });
      } catch {
        // ignore audit failure
      }

      return salesReturn;
    });

    return NextResponse.json({ success: true, returnRecord: result });
  } catch (error: any) {
    console.error('Sales return error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
