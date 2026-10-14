import { NextRequest, NextResponse } from 'next/server';
import { AccountService } from '@/services/account-service';
import { supplierPaymentSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';

    const body = await req.json();
    const parsed = supplierPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid payment data' },
        { status: 400 }
      );
    }

    const result = AccountService.paySupplier({
      ...parsed.data,
      userId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Payment processing failed' },
      { status: 400 }
    );
  }
}
