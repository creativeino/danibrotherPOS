import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { customerSchema } from '@/lib/validations';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
    const mapped = customers.map(c => ({
      id: c.id,
      customerNumber: c.customerNumber,
      name: c.name,
      phone: c.phone ?? null,
      email: c.email ?? null,
      address: c.address ?? null,
      openingBalance: Number(c.openingBalance),
      creditLimit: Number(c.creditLimit),
      depositBalance: Number(c.depositBalance),
      outstandingBalance: Number(c.outstandingBalance),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    return NextResponse.json({ success: true, customers: mapped });
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

    // Generate customer number
    const count = await prisma.customer.count();
    const customerNumber = `CUST-${String(count + 1).padStart(4, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        customerNumber,
        name: parsed.data.name.trim(),
        phone: parsed.data.phone?.trim() || null,
        email: parsed.data.email?.trim() || null,
        address: parsed.data.address?.trim() || null,
        openingBalance: parsed.data.openingBalance ?? 0,
        creditLimit: parsed.data.creditLimit ?? 0,
        depositBalance: 0,
        outstandingBalance: parsed.data.openingBalance ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        openingBalance: Number(customer.openingBalance),
        creditLimit: Number(customer.creditLimit),
        depositBalance: Number(customer.depositBalance),
        outstandingBalance: Number(customer.outstandingBalance),
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Phone number already registered for another customer' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
