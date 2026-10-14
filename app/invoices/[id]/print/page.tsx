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
    phone: dbSettings?.phone ?? '+92 333 1360441',
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
    <div className="min-h-screen bg-slate-100/80 text-black p-3 sm:p-6 font-mono text-[11px] leading-tight flex flex-col items-center print:bg-white print:p-0 print:m-0">
      {/* Auto Trigger Browser Print Dialog */}
      {!noAutoPrint && <AutoPrint autoTrigger={true} />}

      {/* Top Action Toolbar: Hidden When Printing */}
      <div className="w-full max-w-[85mm] mb-4 flex items-center justify-between gap-2 print:hidden bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-sm font-sans">
        <Link
          href="/pos"
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition border border-slate-200/70"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to POS
        </Link>
        
        {/* Paper Size Selector */}
        <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-[11px] font-bold">
          <Link
            href={`/invoices/${encodeURIComponent(invoice.id)}/print?size=58mm&autoprint=false`}
            className={`px-2.5 py-1 rounded-lg transition ${
              is58mm ? 'bg-white text-blue-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            58mm
          </Link>
          <Link
            href={`/invoices/${encodeURIComponent(invoice.id)}/print?size=80mm&autoprint=false`}
            className={`px-2.5 py-1 rounded-lg transition ${
              !is58mm ? 'bg-white text-blue-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            80mm
          </Link>
        </div>

        <PrintButton
          label="Print Slip"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer"
        />
      </div>

      {/* Small Thermal Receipt Container */}
      <div
        id="thermal-receipt-slip"
        className={`${
          is58mm ? 'w-[58mm] max-w-[58mm]' : 'w-[80mm] max-w-[80mm]'
        } bg-white text-black p-3.5 border border-slate-300 rounded-xl shadow-lg print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none text-left`}
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        {/* Header with Official Branding */}
        <div className="text-center pb-2.5 border-b-2 border-dashed border-black">
          <img
            src="/logodanibro.svg"
            alt="Danibrothers"
            className="h-9 w-auto max-w-[135px] mx-auto object-contain block mb-1.5 filter grayscale contrast-200"
          />
          <h1 className="text-[11px] font-black tracking-wider uppercase text-black">
            Danibrothers Computers & CCTV
          </h1>
          <p className="text-[9px] leading-tight text-black mt-1 font-semibold">{settings.address}</p>
          <p className="text-[9.5px] font-black text-black mt-0.5">Contact: {settings.phone}</p>
          {settings.email && (
            <p className="text-[8.5px] text-gray-800">Email: {settings.email}</p>
          )}
        </div>

        {/* Invoice Meta details */}
        <div className="py-2 border-b border-dashed border-black text-[9.5px] space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-bold">INVOICE NO:</span>
            <span className="font-black text-[10.5px] font-mono tracking-tight">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">DATE & TIME:</span>
            <span className="font-medium">
              {new Date(invoice.invoiceDate).toLocaleDateString('en-PK')} {new Date(invoice.invoiceDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">CASHIER / STAFF:</span>
            <span className="font-bold">{invoice.cashierName}</span>
          </div>
          <div className="flex justify-between items-center pt-0.5 border-t border-dotted border-gray-400">
            <span className="font-bold">CUSTOMER:</span>
            <span className="font-extrabold truncate max-w-[140px] uppercase">{invoice.customerName}</span>
          </div>
          {invoice.notes && (
            <div className="text-[8.5px] text-gray-800 italic pt-0.5">
              Ref/Note: {invoice.notes}
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="py-2 border-b-2 border-dashed border-black">
          <div className="flex justify-between font-black text-[9.5px] pb-1 border-b border-black uppercase tracking-wider">
            <span className="w-6/12">ITEM & SPEC</span>
            <span className="w-2/12 text-center">QTY</span>
            <span className="w-4/12 text-right">TOTAL</span>
          </div>
          <div className="divide-y divide-dotted divide-gray-400 pt-1">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item: any, idx: number) => (
                <div key={idx} className="py-1.5 text-[9.5px]">
                  <div className="font-bold leading-tight break-words text-black">
                    {idx + 1}. {item.productName}
                  </div>
                  {item.serviceNotes && (
                    <div className="text-[8.5px] text-gray-800 italic pl-2">
                      &bull; {item.serviceNotes}
                    </div>
                  )}
                  {item.serialNumbers && (
                    <div className="text-[8.5px] font-bold text-black pl-2 tracking-wide">
                      SN: {item.serialNumbers}
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[9px] text-gray-900 mt-1 pl-2">
                    <span className="font-mono">
                      {item.quantity} x {item.unitPrice.toLocaleString()}
                    </span>
                    {item.lineDiscount > 0 && (
                      <span className="text-[8px] font-bold text-gray-700">
                        (Disc -{item.lineDiscount.toLocaleString()})
                      </span>
                    )}
                    <span className="font-black text-black text-[10px] font-mono">
                      Rs. {item.lineTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-gray-500 text-[9px]">No items</div>
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="py-2 border-b-2 border-dashed border-black space-y-1 text-[9.5px]">
          <div className="flex justify-between">
            <span className="font-semibold">SUBTOTAL:</span>
            <span className="font-mono font-bold">Rs. {invoice.subtotal.toLocaleString()}</span>
          </div>
          {invoice.itemDiscountTotal > 0 && (
            <div className="flex justify-between text-gray-800">
              <span>ITEM DISCOUNT:</span>
              <span className="font-mono">- Rs. {invoice.itemDiscountTotal.toLocaleString()}</span>
            </div>
          )}
          {invoice.invoiceDiscount > 0 && (
            <div className="flex justify-between text-gray-800">
              <span className="font-semibold">SPECIAL DISCOUNT:</span>
              <span className="font-mono font-bold">- Rs. {invoice.invoiceDiscount.toLocaleString()}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-gray-800">
              <span>GST / TAX:</span>
              <span className="font-mono font-bold">Rs. {invoice.taxAmount.toLocaleString()}</span>
            </div>
          )}

          {/* Grand Net Total */}
          <div className="flex justify-between items-center font-black text-[12px] pt-1.5 pb-0.5 border-t-2 border-black text-black">
            <span className="tracking-wider">NET PAYABLE:</span>
            <span className="font-mono text-[13px]">Rs. {invoice.grandTotal.toLocaleString()}</span>
          </div>

          {invoice.customerAdvanceUsed > 0 && (
            <div className="flex justify-between font-bold text-gray-800 pt-0.5">
              <span>ADVANCE APPLIED:</span>
              <span className="font-mono">- Rs. {invoice.customerAdvanceUsed.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-[9.5px] pt-1 border-t border-dotted border-gray-400">
            <span className="font-bold">PAID VIA ({invoice.paymentMethod}):</span>
            <span className="font-mono font-black text-black">Rs. {invoice.paymentReceived.toLocaleString()}</span>
          </div>

          {invoice.remainingBalance > 0 ? (
            <div className="flex justify-between font-black text-[10.5px] pt-1 text-black border-t border-black">
              <span>BALANCE REMAINING:</span>
              <span className="font-mono">Rs. {invoice.remainingBalance.toLocaleString()}</span>
            </div>
          ) : (
            <div className="text-right text-[8.5px] font-black tracking-widest text-black pt-0.5">
              *** FULLY PAID ***
            </div>
          )}
        </div>

        {/* Footer Policy, Barcode & Greetings */}
        <div className="pt-2.5 text-center space-y-1.5 text-[8.5px] leading-tight">
          <p className="font-bold text-black uppercase tracking-wide">{settings.invoiceFooter}</p>
          <div className="p-1 border border-dotted border-gray-400 rounded-sm text-[8px] text-gray-800">
            {settings.warrantyPolicy}
          </div>
          
          {/* Machine readable barcode block */}
          <div className="pt-1.5 pb-1">
            <div className="inline-block border-2 border-black px-3 py-1 font-mono tracking-widest text-[12px] font-black bg-white">
              *{invoice.invoiceNumber}*
            </div>
          </div>
          
          <p className="text-[8px] uppercase tracking-widest text-black font-extrabold pt-0.5">
            THANK YOU FOR SHOPPING WITH US!
          </p>
          <p className="text-[7.5px] text-gray-600 font-sans">
            Software by Danibrothers POS Suite
          </p>
        </div>
      </div>

      {/* Strict Mini Thermal Printer Roll CSS (Supports 58mm & 80mm roll formats) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${is58mm ? '58mm' : '80mm'} auto;
          margin: 0mm;
        }
        @media print {
          html, body {
            width: ${is58mm ? '58mm' : '80mm'} !important;
            min-width: ${is58mm ? '58mm' : '80mm'} !important;
            max-width: ${is58mm ? '58mm' : '80mm'} !important;
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
            width: ${is58mm ? '58mm' : '80mm'} !important;
            max-width: ${is58mm ? '58mm' : '80mm'} !important;
            min-width: ${is58mm ? '58mm' : '80mm'} !important;
            margin: 0 !important;
            padding: 2mm 1.5mm !important;
            box-shadow: none !important;
            border: none !important;
            font-size: ${is58mm ? '9.5px' : '11px'} !important;
            line-height: 1.15 !important;
          }
          #thermal-receipt-slip img {
            max-height: ${is58mm ? '30px' : '38px'} !important;
            margin: 0 auto 3px auto !important;
          }
        }
      `}} />
    </div>
  );
}
