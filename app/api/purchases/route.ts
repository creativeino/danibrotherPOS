import { NextRequest, NextResponse } from 'next/server';
import { PurchaseService } from '@/services/purchase-service';
import { purchaseSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const purchases = PurchaseService.getPurchases();
    return NextResponse.json({ success: true, purchases });
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

    const purchase = PurchaseService.createPurchase({
      supplierId: parsed.data.supplierId,
      supplierInvoiceRef: parsed.data.supplierInvoiceRef,
      items: parsed.data.items,
      discountTotal: parsed.data.discountTotal,
      taxAmount: parsed.data.taxAmount,
      shippingCost: parsed.data.shippingCost,
      supplierAdvanceUsed: parsed.data.supplierAdvanceUsed,
      amountPaid: parsed.data.amountPaid,
      notes: parsed.data.notes,
      creatorId,
    });

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
