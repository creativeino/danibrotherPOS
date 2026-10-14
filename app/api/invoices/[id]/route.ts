// Invoice route handlers — Prisma PostgreSQL
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { roundToCents } from '@/lib/calculations';

type Params = { params: Promise<{ id: string }> | { id: string } };

async function resolveInvoice(idOrNumber: string) {
  const clean = idOrNumber.replace(/^#/, '').trim();

  // Try direct ID match
  let inv = await prisma.salesInvoice.findUnique({
    where: { id: clean },
    include: { items: { include: { product: true } }, cashier: true, customer: true },
  });

  // Try invoice number match
  if (!inv) {
    inv = await prisma.salesInvoice.findUnique({
      where: { invoiceNumber: clean },
      include: { items: { include: { product: true } }, cashier: true, customer: true },
    });
  }

  // Try numeric suffix (e.g. "1" → "INV-00001")
  if (!inv && /^\d+$/.test(clean)) {
    const settings = await prisma.shopSettings.findFirst();
    const prefix = settings?.invoicePrefix ?? 'INV-';
    const padded = `${prefix}${clean.padStart(5, '0')}`;
    inv = await prisma.salesInvoice.findUnique({
      where: { invoiceNumber: padded },
      include: { items: { include: { product: true } }, cashier: true, customer: true },
    });
  }

  return inv;
}

function formatInvoice(inv: any) {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    customerId: inv.customerId,
    cashierName: inv.cashier?.fullName ?? 'Staff',
    invoiceDate: inv.invoiceDate,
    subtotal: Number(inv.subtotal),
    itemDiscountTotal: Number(inv.itemDiscountTotal),
    invoiceDiscount: Number(inv.invoiceDiscount),
    taxAmount: Number(inv.taxAmount),
    grandTotal: Number(inv.grandTotal),
    customerAdvanceUsed: Number(inv.customerAdvanceUsed),
    netAmountDue: Number(inv.netAmountDue),
    paymentReceived: Number(inv.paymentReceived),
    remainingBalance: Number(inv.remainingBalance),
    paymentMethod: inv.paymentMethod,
    paymentStatus: inv.paymentStatus,
    notes: inv.notes,
    isVoided: inv.isVoided,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    items: (inv.items ?? []).map((item: any) => ({
      id: item.id,
      salesInvoiceId: item.salesInvoiceId,
      productId: item.productId,
      productName: item.product?.name ?? item.serviceNotes ?? 'Service',
      sku: item.product?.sku ?? 'SRV-LABOR',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      unitCost: Number(item.unitCost),
      lineDiscount: Number(item.lineDiscount),
      lineTotal: Number(item.lineTotal),
      serialNumbers: item.serialNumbers ?? null,
      serviceNotes: item.serviceNotes ?? null,
      returnedQuantity: item.returnedQuantity,
    })),
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const inv = await resolveInvoice(resolvedParams.id);
    if (!inv) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, invoice: formatInvoice(inv) });
  } catch (error: any) {
    console.error('GET invoice error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const inv = await resolveInvoice(resolvedParams.id);
    if (!inv) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerId !== undefined) updateData.customerId = body.customerId;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (body.paymentReceived !== undefined) {
      const newPaid = roundToCents(Number(body.paymentReceived));
      const netDue = Number(inv.netAmountDue);
      const newRemaining = roundToCents(Math.max(0, netDue - newPaid));
      updateData.paymentReceived = newPaid;
      updateData.remainingBalance = newRemaining;
      updateData.paymentStatus = newRemaining === 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID';

      // Sync customer outstanding balance
      if (inv.customerId) {
        const diff = newRemaining - Number(inv.remainingBalance);
        await prisma.customer.update({
          where: { id: inv.customerId },
          data: { outstandingBalance: { increment: diff } },
        });
      }
    }

    if (body.paymentStatus !== undefined && body.paymentReceived === undefined) {
      updateData.paymentStatus = body.paymentStatus;
    }

    const updated = await prisma.salesInvoice.update({
      where: { id: inv.id },
      data: updateData,
      include: { items: { include: { product: true } }, cashier: true, customer: true },
    });

    return NextResponse.json({ success: true, invoice: formatInvoice(updated) });
  } catch (error: any) {
    console.error('PATCH invoice error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await Promise.resolve(params);

    const inv = await resolveInvoice(resolvedParams.id);
    if (!inv) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Restore product stock
      for (const item of inv.items) {
        const product = item.product;
        if (!product || product.sku === 'SRV-LABOR' || product.sku.startsWith('SRV')) continue;

        await tx.product.update({
          where: { id: product.id },
          data: { quantityInStock: { increment: item.quantity }, updatedAt: new Date() },
        });

        // Restore serials
        if (product.requiresSerial && item.serialNumbers) {
          const serialList = item.serialNumbers.split(',').map((s: string) => s.trim());
          for (const sn of serialList) {
            await tx.productSerialNumber.updateMany({
              where: { productId: product.id, serialNumber: sn },
              data: {
                status: 'AVAILABLE',
                salesInvoiceId: null,
                sellingPrice: null,
                warrantyStartDate: null,
                warrantyEndDate: null,
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      // Restore customer balance
      if (inv.customerId) {
        const updates: any = {};
        if (Number(inv.remainingBalance) > 0) {
          updates.outstandingBalance = { decrement: Number(inv.remainingBalance) };
        }
        if (Number(inv.customerAdvanceUsed) > 0) {
          updates.depositBalance = { increment: Number(inv.customerAdvanceUsed) };
        }
        if (Object.keys(updates).length > 0) {
          await tx.customer.update({ where: { id: inv.customerId }, data: updates });
        }
      }

      // Delete invoice items, then invoice (cascade handles items)
      await tx.salesInvoice.delete({ where: { id: inv.id } });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'INVOICE_DELETED',
          entityType: 'SalesInvoice',
          entityId: inv.id,
          details: JSON.stringify({ invoiceNumber: inv.invoiceNumber, grandTotal: Number(inv.grandTotal) }),
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted and stock restored.' });
  } catch (error: any) {
    console.error('DELETE invoice error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
