import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;
    const body = await req.json();

    let settings = await prisma.shopSettings.findFirst();
    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shopName: body.shopName || 'Danibrothers Computers & CCTV',
          phone: body.phone || '+92 300 1234567',
          email: body.email || 'support@danibrothers.pk',
          address: body.address || 'Main Commercial Market, Pakistan',
          currencyCode: body.currencyCode || 'PKR',
          currencySymbol: body.currencySymbol || 'Rs.',
          invoicePrefix: body.invoicePrefix || 'INV-',
          purchasePrefix: body.purchasePrefix || 'PUR-',
          receiptSize: body.receiptSize || '80mm',
          allowNegativeStock: Boolean(body.allowNegativeStock),
          taxEnabled: Boolean(body.taxEnabled),
          defaultTaxRate: Number(body.defaultTaxRate) || 0,
          warrantyPolicy: body.warrantyPolicy || '',
          returnPolicy: body.returnPolicy || '',
          invoiceFooter: body.invoiceFooter || '',
        },
      });
    } else {
      settings = await prisma.shopSettings.update({
        where: { id: settings.id },
        data: {
          ...(body.shopName !== undefined && { shopName: body.shopName }),
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.email !== undefined && { email: body.email }),
          ...(body.address !== undefined && { address: body.address }),
          ...(body.invoicePrefix !== undefined && { invoicePrefix: body.invoicePrefix }),
          ...(body.purchasePrefix !== undefined && { purchasePrefix: body.purchasePrefix }),
          ...(body.receiptSize !== undefined && { receiptSize: body.receiptSize }),
          ...(body.allowNegativeStock !== undefined && { allowNegativeStock: Boolean(body.allowNegativeStock) }),
          ...(body.taxEnabled !== undefined && { taxEnabled: Boolean(body.taxEnabled) }),
          ...(body.defaultTaxRate !== undefined && { defaultTaxRate: Number(body.defaultTaxRate) || 0 }),
          ...(body.warrantyPolicy !== undefined && { warrantyPolicy: body.warrantyPolicy }),
          ...(body.returnPolicy !== undefined && { returnPolicy: body.returnPolicy }),
          ...(body.invoiceFooter !== undefined && { invoiceFooter: body.invoiceFooter }),
        },
      });
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: 'SETTINGS_UPDATED',
          entityType: 'ShopSettings',
          entityId: settings.id,
          details: JSON.stringify(body),
        },
      });
    } catch {
      // ignore audit log failure if any
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
