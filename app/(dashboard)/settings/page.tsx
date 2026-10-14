import React from 'react';
import { prisma } from '@/lib/prisma';
import { SettingsForm } from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  let settings = await prisma.shopSettings.findFirst();

  if (!settings) {
    settings = await prisma.shopSettings.create({
      data: {
        shopName: 'Danibrothers Computers & CCTV',
        phone: '+92 300 1234567',
        email: 'support@danibrothers.pk',
        address: 'Main Commercial Market, Pakistan',
        currencyCode: 'PKR',
        currencySymbol: 'Rs.',
        invoicePrefix: 'INV-',
        purchasePrefix: 'PUR-',
        receiptSize: '80mm',
        allowNegativeStock: false,
        taxEnabled: false,
        defaultTaxRate: 0,
        warrantyPolicy: '1 Year Warranty on Hardware items with serial confirmation.',
        returnPolicy: 'Goods once sold can only be returned within 3 days if undamaged with original receipt.',
      },
    });
  }

  const mappedSettings = {
    id: settings.id,
    shopName: settings.shopName,
    logoUrl: settings.logoUrl ?? null,
    address: settings.address ?? '',
    phone: settings.phone ?? '',
    email: settings.email ?? '',
    currencySymbol: settings.currencySymbol ?? 'Rs.',
    currencyCode: settings.currencyCode ?? 'PKR',
    timezone: settings.timezone ?? 'Asia/Karachi',
    invoicePrefix: settings.invoicePrefix ?? 'INV-',
    purchasePrefix: settings.purchasePrefix ?? 'PUR-',
    receiptSize: settings.receiptSize ?? '80mm',
    taxEnabled: settings.taxEnabled,
    defaultTaxRate: Number(settings.defaultTaxRate),
    allowNegativeStock: settings.allowNegativeStock,
    invoiceFooter: settings.invoiceFooter ?? '',
    warrantyPolicy: settings.warrantyPolicy ?? '',
    returnPolicy: settings.returnPolicy ?? '',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shop Configuration & Preferences</h1>
        <p className="text-xs text-slate-500 font-medium">
          Configure business details, invoice sequence numbering, currency (PKR), thermal printing, and warranty policies
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <SettingsForm initialSettings={mappedSettings} />
      </div>
    </div>
  );
}
