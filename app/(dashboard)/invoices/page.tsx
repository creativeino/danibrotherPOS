import React from 'react';
import { prisma } from '@/lib/prisma';
import { InvoicesTable } from '@/components/InvoicesTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InvoicesPage() {
  const rawSales = await prisma.salesInvoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: true } },
      cashier: true,
      customer: true,
    },
  });

  const sales = rawSales.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    customerId: inv.customerId,
    cashierName: inv.cashier?.fullName ?? 'Staff',
    invoiceDate: inv.invoiceDate.toISOString(),
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
    items: inv.items.map(item => ({
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
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Invoices & Receipts</h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage sales records, reprint thermal slips, edit invoice details, or delete & restock
          </p>
        </div>
      </div>

      <InvoicesTable invoices={sales} />
    </div>
  );
}
