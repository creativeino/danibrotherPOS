import React from 'react';
import { prisma } from '@/lib/prisma';
import { NewReturnModal } from '@/components/NewReturnModal';
import { SalesReturnsTable } from '@/components/SalesReturnsTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SalesReturnsPage() {
  const [rawReturns, rawSales] = await Promise.all([
    prisma.salesReturn.findMany({
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
    }),
    prisma.salesInvoice.findMany({
      where: { isVoided: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
  ]);

  const returns = rawReturns.map(r => ({
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
  }));

  // Attach items to active non-voided sales for the modal
  const salesWithItems = rawSales.map(s => ({
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    customerName: s.customer?.name || s.customerName || 'Walk-in Customer',
    invoiceDate: s.invoiceDate.toISOString(),
    items: s.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || 'Item',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      returnedQuantity: item.returnedQuantity,
      serialNumbers: item.serialNumbers,
    })),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Returns & Refunds</h1>
          <p className="text-xs text-slate-500 font-medium">
            Process returned merchandise, edit refund details, or delete & reverse return transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewReturnModal invoices={salesWithItems as any} />
        </div>
      </div>

      <SalesReturnsTable initialReturns={returns} />
    </div>
  );
}

