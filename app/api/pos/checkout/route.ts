import { NextRequest, NextResponse } from 'next/server';
import { POSService } from '@/services/pos-service';
import { checkoutSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const cashierId = user?.id || 'usr-danish';

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid checkout payload' },
        { status: 400 }
      );
    }

    const result = POSService.processCheckout({
      cashierId,
      customerId: parsed.data.customerId,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      items: parsed.data.items,
      invoiceDiscountAmount: parsed.data.invoiceDiscountAmount,
      taxRatePercent: parsed.data.taxRatePercent,
      customerAdvanceApplied: parsed.data.customerAdvanceApplied,
      paymentReceived: parsed.data.paymentReceived,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, invoice: result.invoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
