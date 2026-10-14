import { NextRequest, NextResponse } from 'next/server';
import { checkoutSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateInvoiceTotals, roundToCents } from '@/lib/calculations';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid checkout payload' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Resolve cashier — use logged-in user or fall back to first admin
    let cashier: any = null;
    if (user?.id) {
      cashier = await prisma.user.findUnique({ where: { id: user.id } });
    }
    if (!cashier) {
      cashier = await prisma.user.findFirst({ where: { active: true } });
    }
    if (!cashier) {
      return NextResponse.json({ success: false, error: 'No active user found in system. Please seed the database.' }, { status: 400 });
    }

    // Validate customer name
    const resolvedCustomerName = (data.customerName || '').trim();
    if (!resolvedCustomerName || resolvedCustomerName.length < 2) {
      return NextResponse.json({ success: false, error: 'Customer name is mandatory.' }, { status: 400 });
    }

    // Resolve registered customer (optional)
    let customer: any = null;
    if (data.customerId) {
      customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    }

    // Load products to validate stock
    const productIds = data.items
      .filter(i => !i.isService && !i.productId.startsWith('srv-custom-'))
      .map(i => i.productId);

    const products = productIds.length > 0
      ? await prisma.product.findMany({ where: { id: { in: productIds } } })
      : [];

    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate stock
    const settings = await prisma.shopSettings.findFirst();
    const allowNegativeStock = settings?.allowNegativeStock ?? false;

    for (const item of data.items) {
      if (item.isService || item.productId.startsWith('srv-custom-')) continue;

      const product = productMap.get(item.productId);
      if (!product || !product.active) {
        return NextResponse.json(
          { success: false, error: `Product not found or inactive: ${item.productId}` },
          { status: 400 }
        );
      }

      if (!allowNegativeStock && product.quantityInStock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for "${product.name}". Available: ${product.quantityInStock}, requested: ${item.quantity}` },
          { status: 400 }
        );
      }

      if (product.requiresSerial) {
        const serials = item.selectedSerials || [];
        if (serials.length !== item.quantity) {
          return NextResponse.json(
            { success: false, error: `"${product.name}" requires ${item.quantity} serial number(s). Provided: ${serials.length}` },
            { status: 400 }
          );
        }
        // Validate each serial
        for (const sn of serials) {
          const serialRecord = await prisma.productSerialNumber.findFirst({
            where: { productId: product.id, serialNumber: sn, status: 'AVAILABLE' },
          });
          if (!serialRecord) {
            return NextResponse.json(
              { success: false, error: `Serial "${sn}" for "${product.name}" is not available or already sold.` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Compute totals
    const totals = calculateInvoiceTotals({
      items: data.items.map(i => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineDiscount: i.lineDiscount,
      })),
      invoiceDiscountAmount: data.invoiceDiscountAmount,
      taxRatePercent: data.taxRatePercent ?? (settings?.taxEnabled ? Number(settings.defaultTaxRate) : 0),
      customerAdvanceApplied: data.customerAdvanceApplied,
      paymentReceived: data.paymentReceived,
    });

    // Validate advance if applied
    if (totals.customerAdvanceApplied > 0) {
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Cannot apply advance for walk-in customer' }, { status: 400 });
      }
      if (Number(customer.depositBalance) < totals.customerAdvanceApplied) {
        return NextResponse.json(
          { success: false, error: `Customer advance (Rs. ${totals.customerAdvanceApplied}) exceeds available deposit balance (Rs. ${customer.depositBalance})` },
          { status: 400 }
        );
      }
    }

    // Generate invoice number
    const invoiceCount = await prisma.salesInvoice.count();
    const invoicePrefix = settings?.invoicePrefix ?? 'INV-';
    const invoiceNumber = `${invoicePrefix}${String(invoiceCount + 1).padStart(5, '0')}`;

    const nowIso = new Date();

    // ---- Run entire checkout in a single transaction ----
    const invoice = await prisma.$transaction(async (tx) => {
      const createdItems: any[] = [];

      for (const item of data.items) {
        const isService = item.isService || item.productId.startsWith('srv-custom-');
        const lineGross = roundToCents(item.quantity * item.unitPrice);
        const lineTotal = roundToCents(lineGross - (item.lineDiscount || 0));

        let productId = item.productId;
        let productName = item.name || 'Custom Service';
        let productSku = 'SRV-LABOR';

        if (!isService) {
          const product = productMap.get(item.productId)!;
          productId = product.id;
          productName = product.name;
          productSku = product.sku;

          // Deduct stock
          await tx.product.update({
            where: { id: product.id },
            data: { quantityInStock: { decrement: item.quantity }, updatedAt: nowIso },
          });

          // Mark serials as SOLD
          if (product.requiresSerial && item.selectedSerials?.length) {
            for (const sn of item.selectedSerials) {
              const warrantyEnd = product.warrantyDurationMonths > 0
                ? new Date(nowIso.getTime() + product.warrantyDurationMonths * 30 * 24 * 60 * 60 * 1000)
                : null;
              await tx.productSerialNumber.updateMany({
                where: { productId: product.id, serialNumber: sn },
                data: {
                  status: 'SOLD',
                  sellingPrice: item.unitPrice,
                  warrantyStartDate: nowIso,
                  warrantyEndDate: warrantyEnd,
                  updatedAt: nowIso,
                },
              });
            }
          }

          // Record inventory movement
          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              movementType: 'SALE_DEDUCTION',
              quantityChange: -item.quantity,
              previousStock: product.quantityInStock,
              newStock: product.quantityInStock - item.quantity,
              unitCost: product.costPrice,
              referenceType: 'SALE',
              referenceId: invoiceNumber,
              reason: `Sold on invoice ${invoiceNumber}`,
              performedById: cashier.id,
              createdAt: nowIso,
            },
          });
        } else {
          // For custom services: ensure a service product exists or use a virtual one
          // We'll store productName in the invoice item directly via serviceNotes
          productSku = 'SRV-LABOR';
        }

        createdItems.push({
          isService,
          productId,
          productName,
          productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: isService ? 0 : (productMap.get(productId)?.costPrice ?? 0),
          lineDiscount: item.lineDiscount || 0,
          lineTotal,
          serialNumbers: item.selectedSerials?.length ? item.selectedSerials.join(', ') : null,
          serviceNotes: item.serviceNotes || null,
        });
      }

      // Update customer balance
      if (customer) {
        const updates: any = {};
        if (totals.customerAdvanceApplied > 0) {
          updates.depositBalance = { decrement: totals.customerAdvanceApplied };
        }
        if (totals.remainingBalance > 0) {
          updates.outstandingBalance = { increment: totals.remainingBalance };
        }
        if (Object.keys(updates).length > 0) {
          await tx.customer.update({ where: { id: customer.id }, data: updates });
        }

        // Customer ledger entry
        const updatedCustomer = await tx.customer.findUnique({ where: { id: customer.id } });
        await tx.customerLedgerEntry.create({
          data: {
            customerId: customer.id,
            entryDate: nowIso,
            reference: invoiceNumber,
            description: `Sale Invoice ${invoiceNumber}`,
            debit: totals.grandTotal,
            credit: totals.paymentReceived + totals.customerAdvanceApplied,
            balanceAfter: Number(updatedCustomer?.outstandingBalance ?? 0),
            createdAt: nowIso,
          },
        });
      }

      const combinedNotes = [
        data.notes?.trim(),
        data.customerPhone?.trim() ? `Phone: ${data.customerPhone.trim()}` : null,
      ].filter(Boolean).join(' | ') || null;

      // Create invoice
      const salesInvoice = await tx.salesInvoice.create({
        data: {
          invoiceNumber,
          customerId: customer?.id ?? null,
          customerName: resolvedCustomerName,
          cashierId: cashier.id,
          invoiceDate: nowIso,
          subtotal: totals.subtotal,
          itemDiscountTotal: totals.itemDiscountTotal,
          invoiceDiscount: totals.invoiceDiscount,
          taxAmount: totals.taxAmount,
          grandTotal: totals.grandTotal,
          customerAdvanceUsed: totals.customerAdvanceApplied,
          netAmountDue: totals.netAmountDue,
          paymentReceived: totals.paymentReceived,
          remainingBalance: totals.remainingBalance,
          paymentMethod: data.paymentMethod as any,
          paymentStatus: totals.paymentStatus as any,
          notes: combinedNotes,
          isVoided: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      });

      // Create invoice items
      const invoiceItemsData: any[] = [];
      for (const ci of createdItems) {
        // For custom services: find or create a service product in DB
        let dbProductId = ci.productId;

        if (ci.isService && ci.productId.startsWith('srv-custom-')) {
          // Try to find an existing service product
          let serviceProduct = await tx.product.findFirst({
            where: { sku: 'SRV-LABOR', active: true },
          });
          if (!serviceProduct) {
            // Create a generic service product
            serviceProduct = await tx.product.create({
              data: {
                name: 'Custom IT Service / Repair',
                sku: 'SRV-LABOR',
                barcode: `SRV-${Date.now()}`,
                unit: 'PIECE' as any,
                costPrice: 0,
                sellingPrice: ci.unitPrice,
                quantityInStock: 0,
                reorderLevel: 0,
                requiresSerial: false,
                warrantyDurationMonths: 0,
                taxRatePercent: 0,
                active: true,
              },
            });
          }
          dbProductId = serviceProduct.id;
        }

        invoiceItemsData.push({
          salesInvoiceId: salesInvoice.id,
          productId: dbProductId,
          quantity: ci.quantity,
          unitPrice: ci.unitPrice,
          unitCost: Number(ci.unitCost),
          lineDiscount: ci.lineDiscount,
          lineTotal: ci.lineTotal,
          serialNumbers: ci.serialNumbers,
          serviceNotes: ci.serviceNotes ?? (ci.isService ? ci.productName : null),
          returnedQuantity: 0,
          createdAt: nowIso,
        });
      }

      await tx.salesInvoiceItem.createMany({ data: invoiceItemsData });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: cashier.id,
          action: 'SALE_COMPLETED',
          entityType: 'SalesInvoice',
          entityId: salesInvoice.id,
          details: JSON.stringify({ invoiceNumber, grandTotal: totals.grandTotal, itemsCount: data.items.length }),
          createdAt: nowIso,
        },
      });

      return {
        ...salesInvoice,
        items: createdItems,
        cashierName: cashier.fullName,
      };
    });

    // Return invoice view compatible with existing frontend
    const invoiceView = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerId: invoice.customerId,
      cashierName: invoice.cashierName,
      invoiceDate: invoice.invoiceDate,
      subtotal: Number(invoice.subtotal),
      itemDiscountTotal: Number(invoice.itemDiscountTotal),
      invoiceDiscount: Number(invoice.invoiceDiscount),
      taxAmount: Number(invoice.taxAmount),
      grandTotal: Number(invoice.grandTotal),
      customerAdvanceUsed: Number(invoice.customerAdvanceUsed),
      netAmountDue: Number(invoice.netAmountDue),
      paymentReceived: Number(invoice.paymentReceived),
      remainingBalance: Number(invoice.remainingBalance),
      paymentMethod: invoice.paymentMethod,
      paymentStatus: invoice.paymentStatus,
      notes: invoice.notes,
      isVoided: invoice.isVoided,
      items: invoice.items,
      createdAt: invoice.createdAt,
    };

    return NextResponse.json({ success: true, invoice: invoiceView });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error during checkout' }, { status: 500 });
  }
}
