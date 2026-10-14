import { NextRequest, NextResponse } from 'next/server';
import { AccountService } from '@/services/account-service';
import { supplierSchema } from '@/lib/validations';

export async function GET() {
  try {
    const suppliers = AccountService.getSuppliers();
    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = supplierSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid supplier data' },
        { status: 400 }
      );
    }

    const supplier = AccountService.createSupplier({
      name: parsed.data.name,
      companyName: parsed.data.companyName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      openingBalance: parsed.data.openingBalance,
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
