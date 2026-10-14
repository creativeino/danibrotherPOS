import { NextRequest, NextResponse } from 'next/server';
import { AccountService } from '@/services/account-service';
import { customerDepositSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const body = await req.json();

    const parsed = customerDepositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid deposit data' },
        { status: 400 }
      );
    }

    const deposit = AccountService.addCustomerDeposit({
      customerId: parsed.data.customerId,
      amount: parsed.data.amount,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes,
      userId,
    });

    return NextResponse.json({ success: true, deposit });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Deposit recording failed' },
      { status: 400 }
    );
  }
}
