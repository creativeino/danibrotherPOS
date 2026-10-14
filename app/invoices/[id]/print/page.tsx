import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/calculations';
import { PrintButton } from '@/components/PrintButton';
import { AutoPrint } from '@/components/AutoPrint';
import { ArrowLeft, ShoppingBag, FileText, AlertCircle, Printer } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const rawId = resolvedParams?.id ? String(resolvedParams.id).trim() : '';
  let id = rawId;
  try {
    id = decodeURIComponent(rawId).trim();
  } catch {
    // fallback
  }

  const include = { items: { include: { product: true } }, cashier: true };

  async function fetchInvoice(idOrNumber: string) {
    const clean = idOrNumber.replace(/^#/, '').trim();
    let inv = await prisma.salesInvoice.findUnique({ where: { id: clean }, include });
    if (!inv) inv = await prisma.salesInvoice.findUnique({ where: { invoiceNumber: clean }, include });
    if (!inv && /^\d+$/.test(clean)) {
      const s = await prisma.shopSettings.findFirst();
      const prefix = s?.invoicePrefix ?? 'INV-';
      inv = await prisma.salesInvoice.findUnique({ where: { invoiceNumber: `${prefix}${clean.padStart(5, '0')}` }, include });
    }
    return inv;
  }

  function mapInvoice(inv: any) {
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
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
      notes: inv.notes,
      isVoided: inv.isVoided,
      items: (inv.items ?? []).map((item: any) => ({
        productName: (item.serviceNotes && (!item.product || item.product.sku === 'SRV-LABOR'))
          ? item.serviceNotes
          : (item.product?.name ?? item.serviceNotes ?? 'Service'),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineDiscount: Number(item.lineDiscount),
        lineTotal: Number(item.lineTotal),
        serialNumbers: item.serialNumbers ?? null,
        serviceNotes: item.serviceNotes ?? null,
      })),
    };
  }

  const rawInvoice = id ? await fetchInvoice(id) : null;
  const invoice = rawInvoice ? mapInvoice(rawInvoice) : null;

  const dbSettings = await prisma.shopSettings.findFirst();
  const settings = {
    address: dbSettings?.address ?? 'B-13 Sector Z6 Gulshan-e-Maymar, Karachi',
    phone: dbSettings?.phone ?? '+92 300 1234567',
    email: dbSettings?.email ?? 'danibrothers99@gmail.com',
    invoiceFooter: dbSettings?.invoiceFooter ?? 'Thank you for choosing Danibrothers! Warranty claims require original receipt.',
    warrantyPolicy: dbSettings?.warrantyPolicy ?? '7-Day Check Warranty on used laptops/PCs.',
  };

  const noAutoPrint = resolvedSearchParams?.autoprint === 'false';
  const sizeParam = resolvedSearchParams?.size === '80mm' ? '80mm' : '58mm';

  if (!invoice) {
    const latestRaw = await prisma.salesInvoice.findFirst({ orderBy: { createdAt: 'desc' } });
    const latestInvoice = latestRaw ? {
      id: latestRaw.id,
      invoiceNumber: latestRaw.invoiceNumber,
      customerName: latestRaw.customerName,
      grandTotal: Number(latestRaw.grandTotal),
    } : null;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-6 flex flex-col items-center justify-center font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 max-w-lg w-full text-center space-y-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Invoice Slip Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">
              Could not find invoice matching <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">"{id || 'empty'}"</span>.
            </p>
          </div>

          {latestInvoice && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Most Recent Sale:</span>
                <span className="font-mono text-xs font-bold text-blue-700">{latestInvoice.invoiceNumber}</span>
              </div>
              <div className="text-xs text-slate-600 flex justify-between">
                <span>Customer: <strong>{latestInvoice.customerName}</strong></span>
                <span className="font-bold text-slate-900">{formatCurrency(latestInvoice.grandTotal)}</span>
              </div>
              <Link
                href={`/invoices/${latestInvoice.id}/print`}
                className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4" /> Print Latest Invoice ({latestInvoice.invoiceNumber})
              </Link>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/pos"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <ShoppingBag className="w-4 h-4" /> Go to POS Terminal
            </Link>
            <Link
              href="/invoices"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4" /> All Sales Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const is58mm = sizeParam === '58mm';

  return (
    <div className="min-h-screen bg-slate-100 text-black p-2 sm:p-4 font-mono text-[11px] leading-tight flex flex-col items-center print:bg-white print:p-0 print:m-0">
      {/* Auto Trigger Browser Print Dialog */}
      {!noAutoPrint && <AutoPrint autoTrigger={true} />}

      {/* Top Action Toolbar: Hidden When Printing */}
      <div className="w-full max-w-[58mm] mb-3 flex items-center justify-between gap-1 print:hidden bg-white p-2 rounded-xl border border-slate-200 shadow-sm font-sans">
        <Link
          href="/pos"
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3 h-3" /> POS
        </Link>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {is58mm ? '58mm Slip' : '80mm Slip'}
        </span>
        <PrintButton
          label="Print"
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
        />
      </div>

      {/* Small Thermal Receipt Container (Standard 58mm / 2-inch mini POS paper roll) */}
      <div
        id="thermal-receipt-slip"
        className={`${
          is58mm ? 'w-[58mm] max-w-[58mm]' : 'w-[80mm] max-w-[80mm]'
        } bg-white text-black p-2.5 border border-dashed border-gray-300 shadow-md print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none text-left`}
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        {/* Header */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <img
            src="/logodanibro.svg"
            alt="Danibrothers"
            className="h-8 w-auto max-w-[120px] mx-auto object-contain block mb-1 filter grayscale contrast-200"
          />
          <p className="text-[9px] leading-tight text-black mt-0.5">{settings.address}</p>
          <p className="text-[9px] font-bold text-black">Tel: {settings.phone}</p>
          <p className="text-[8.5px] text-black">Email: {settings.email || 'danibrothers99@gmail.com'}</p>
        </div>

        {/* Invoice Meta */}
        <div className="py-1.5 border-b border-dashed border-black text-[9.5px] space-y-0.5">
          <div className="flex justify-between">
            <span className="font-semibold">INVOICE:</span>
            <span className="font-extrabold">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>DATE:</span>
            <span>{new Date(invoice.invoiceDate).toLocaleDateString('en-PK')} {new Date(invoice.invoiceDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between">
            <span>CASHIER:</span>
            <span>{invoice.cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">CUSTOMER:</span>
            <span className="font-bold truncate max-w-[120px]">{invoice.customerName}</span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-1.5 border-b border-dashed border-black">
          <div className="flex justify-between font-bold text-[9px] pb-1 border-b border-black">
            <span className="w-7/12">ITEM</span>
            <span className="w-2/12 text-center">QTY</span>
            <span className="w-3/12 text-right">TOTAL</span>
          </div>
          <div className="divide-y divide-dashed divide-gray-300 pt-1">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item: any, idx: number) => (
                <div key={idx} className="py-1 text-[9.5px]">
                  <div className="font-bold leading-tight break-words">{item.productName}</div>
                  {item.serviceNotes && (
                    <div className="text-[8.5px] text-gray-800">Note: {item.serviceNotes}</div>
                  )}
                  {item.serialNumbers && (
                    <div className="text-[8.5px] font-bold">SN: {item.serialNumbers}</div>
                  )}
                  <div className="flex justify-between items-center text-[9px] text-gray-900 mt-0.5">
                    <span>{item.quantity} x {item.unitPrice}</span>
                    {item.lineDiscount > 0 && <span className="text-[8px]">(-{item.lineDiscount})</span>}
                    <span className="font-extrabold text-black text-[9.5px]">Rs. {item.lineTotal.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-1 text-center text-gray-500 text-[9px]">No items</div>
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="py-1.5 border-b border-dashed border-black space-y-0.5 text-[9.5px]">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>Rs. {invoice.subtotal.toLocaleString()}</span>
          </div>
          {invoice.itemDiscountTotal > 0 && (
            <div className="flex justify-between">
              <span>ITEM DISC:</span>
              <span>- Rs. {invoice.itemDiscountTotal.toLocaleString()}</span>
            </div>
          )}
          {invoice.invoiceDiscount > 0 && (
            <div className="flex justify-between">
              <span>SPECIAL DISC:</span>
              <span>- Rs. {invoice.invoiceDiscount.toLocaleString()}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>TAX:</span>
              <span>Rs. {invoice.taxAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-[11px] pt-1 border-t border-black text-black">
            <span>NET TOTAL:</span>
            <span>Rs. {invoice.grandTotal.toLocaleString()}</span>
          </div>
          {invoice.customerAdvanceUsed > 0 && (
            <div className="flex justify-between font-bold">
              <span>ADVANCE USED:</span>
              <span>- Rs. {invoice.customerAdvanceUsed.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-[9px] pt-0.5">
            <span>PAID ({invoice.paymentMethod}):</span>
            <span className="font-bold">Rs. {invoice.paymentReceived.toLocaleString()}</span>
          </div>
          {invoice.remainingBalance > 0 && (
            <div className="flex justify-between font-extrabold text-[10px] pt-0.5 border-t border-dotted border-black">
              <span>BALANCE DUE:</span>
              <span>Rs. {invoice.remainingBalance.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Footer Policy & Barcode */}
        <div className="pt-2 text-center space-y-1 text-[8.5px] leading-tight">
          <p className="font-bold text-black">{settings.invoiceFooter}</p>
          <p className="text-[8px] text-gray-700">{settings.warrantyPolicy}</p>
          
          {/* Machine barcode format */}
          <div className="pt-1.5 pb-1">
            <span className="font-mono tracking-widest text-[11px] font-black border-2 border-black px-2 py-0.5 inline-block">
              *{invoice.invoiceNumber}*
            </span>
          </div>
          <p className="text-[7.5px] uppercase tracking-wider text-black font-semibold">
            *** THANK YOU FOR VISITING ***
          </p>
        </div>
      </div>

      {/* Strict Mini Thermal Printer Roll CSS (58mm / 2-inch roll format) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: 58mm auto;
          margin: 0mm;
        }
        @media print {
          html, body {
            width: 58mm !important;
            min-width: 58mm !important;
            max-width: 58mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #thermal-receipt-slip, #thermal-receipt-slip * {
            visibility: visible;
          }
          #thermal-receipt-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            min-width: 58mm !important;
            margin: 0 !important;
            padding: 2mm 1.5mm !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 9.5px !important;
            line-height: 1.15 !important;
          }
          #thermal-receipt-slip img {
            max-height: 28px !important;
            margin: 0 auto 2px auto !important;
          }
        }
      `}} />
    </div>
  );
}
