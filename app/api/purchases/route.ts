import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { purchaseSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';
import { roundToCents } from '@/lib/calculations';

export async function GET() {
  try {
    const purchases = await prisma.purchaseInvoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const mapped = purchases.map(p => ({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      supplierId: p.supplierId,
      supplierName: p.supplier?.name || 'Supplier',
      supplierInvoiceRef: p.supplierInvoiceRef,
      purchaseDate: p.purchaseDate.toISOString(),
      subtotal: Number(p.subtotal),
      discountTotal: Number(p.discountTotal),
      taxAmount: Number(p.taxAmount),
      shippingCost: Number(p.shippingCost),
      grandTotal: Number(p.grandTotal),
      supplierAdvanceUsed: Number(p.supplierAdvanceUsed),
      netAmountDue: Number(p.netAmountDue),
      amountPaid: Number(p.amountPaid),
      remainingBalance: Number(p.remainingBalance),
      paymentStatus: p.paymentStatus,
      notes: p.notes,
      items: p.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Product',
        quantity: item.quantity,
        unitCost: Number(item.unitCost),
        lineDiscount: Number(item.lineDiscount),
        lineTotal: Number(item.lineTotal),
        serialNumbers: item.serialNumbers,
      })),
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, purchases: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const creatorId = user?.id || 'usr-danish';

    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid purchase data' },
        { status: 400 }
      );
    }

    const {
      supplierId,
      supplierInvoiceRef,
      items,
      discountTotal = 0,
      taxAmount = 0,
      shippingCost = 0,
      supplierAdvanceUsed = 0,
      amountPaid = 0,
      notes,
    } = parsed.data;

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    const count = await prisma.purchaseInvoice.count();
    const purchaseNumber = `PUR-${String(count + 1).padStart(5, '0')}`;

    const purchase = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const purchaseItemsData: any[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const gross = roundToCents(item.quantity * item.unitCost);
        const discount = item.lineDiscount || 0;
        const lineTotal = roundToCents(gross - discount);
        subtotal += lineTotal;

        const prevStock = product.quantityInStock;
        const newStock = prevStock + item.quantity;

        // Update product stock and current replacement cost
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantityInStock: newStock,
            costPrice: item.unitCost,
            updatedAt: new Date(),
          },
        });

        // Register serial numbers if provided
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          for (const sn of item.serialNumbers) {
            await tx.productSerialNumber.create({
              data: {
                productId: product.id,
                serialNumber: sn,
                status: 'AVAILABLE',
                costPrice: item.unitCost,
                sellingPrice: product.sellingPrice,
                warrantyMonths: product.warrantyDurationMonths || 12,
              },
            });
          }
        }

        // Record Inventory Movement
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            movementType: 'PURCHASE_RECEIPT',
            quantityChange: item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            unitCost: item.unitCost,
            referenceType: 'PURCHASE',
            referenceId: purchaseNumber,
            reason: `Received on purchase invoice ${purchaseNumber}`,
            performedById: creatorId,
          },
        });

        purchaseItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitCost: item.unitCost,
          lineDiscount: discount,
          lineTotal,
          serialNumbers: item.serialNumbers?.join(', ') || null,
        });
      }

      subtotal = roundToCents(subtotal);
      const overallDiscount = roundToCents(discountTotal);
      const tax = roundToCents(taxAmount);
      const shipping = roundToCents(shippingCost);
      const grandTotal = roundToCents(subtotal - overallDiscount + tax + shipping);

      const advanceUsed = roundToCents(Math.min(grandTotal, supplierAdvanceUsed));
      const netDue = roundToCents(grandTotal - advanceUsed);
      const paid = roundToCents(amountPaid);
      const remainingBalance = roundToCents(Math.max(0, netDue - paid));

      let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'PAID';
      if (remainingBalance > 0 && paid > 0) paymentStatus = 'PARTIAL';
      else if (remainingBalance > 0 && paid === 0) paymentStatus = 'UNPAID';

      // Update Supplier Advance & Payables
      const currentAdvance = Number(supplier.advanceBalance);
      const currentOutstanding = Number(supplier.outstandingBalance);

      const newAdvance = advanceUsed > 0 ? roundToCents(Math.max(0, currentAdvance - advanceUsed)) : currentAdvance;
      const newOutstanding = remainingBalance > 0 ? roundToCents(currentOutstanding + remainingBalance) : currentOutstanding;

      await tx.supplier.update({
        where: { id: supplier.id },
        data: {
          advanceBalance: newAdvance,
          outstandingBalance: newOutstanding,
          updatedAt: new Date(),
        },
      });

      // Post to Supplier Ledger
      await tx.supplierLedgerEntry.create({
        data: {
          supplierId: supplier.id,
          entryDate: new Date(),
          reference: purchaseNumber,
          description: `Purchase Inward Bill ${purchaseNumber}`,
          debit: paid + advanceUsed, // Disbursed / advance adjusted
          credit: grandTotal,        // Total purchase liability
          balanceAfter: newOutstanding,
        },
      });

      // Create Purchase Invoice
      const createdPurchase = await tx.purchaseInvoice.create({
        data: {
          purchaseNumber,
          supplierId: supplier.id,
          supplierInvoiceRef: supplierInvoiceRef || null,
          creatorId,
          subtotal,
          discountTotal: overallDiscount,
          taxAmount: tax,
          shippingCost: shipping,
          grandTotal,
          supplierAdvanceUsed: advanceUsed,
          netAmountDue: netDue,
          amountPaid: paid,
          remainingBalance,
          paymentStatus,
          notes: notes || null,
          items: {
            create: purchaseItemsData,
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      return createdPurchase;
    });

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    console.error('Purchase creation error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
