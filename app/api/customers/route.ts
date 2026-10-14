import { NextRequest, NextResponse } from 'next/server';
import { AccountService } from '@/services/account-service';
import { customerSchema } from '@/lib/validations';

export async function GET() {
  try {
    const customers = AccountService.getCustomers();
    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid customer data' },
        { status: 400 }
      );
    }

    const customer = AccountService.createCustomer({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      openingBalance: parsed.data.openingBalance,
      creditLimit: parsed.data.creditLimit,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
