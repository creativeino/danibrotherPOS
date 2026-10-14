import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supplierSchema } from '@/lib/validations';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    const mapped = suppliers.map(s => ({
      id: s.id,
      supplierNumber: s.supplierNumber,
      name: s.name,
      companyName: s.companyName,
      phone: s.phone,
      email: s.email,
      address: s.address,
      openingBalance: Number(s.openingBalance),
      advanceBalance: Number(s.advanceBalance),
      outstandingBalance: Number(s.outstandingBalance),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
    return NextResponse.json({ success: true, suppliers: mapped });
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

    const count = await prisma.supplier.count();
    const supplierNumber = `SUP-${String(count + 1).padStart(4, '0')}`;
    const opening = Number(parsed.data.openingBalance) || 0;

    const supplier = await prisma.supplier.create({
      data: {
        supplierNumber,
        name: parsed.data.name.trim(),
        companyName: parsed.data.companyName?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
        email: parsed.data.email?.trim() || null,
        address: parsed.data.address?.trim() || null,
        openingBalance: opening,
        advanceBalance: 0,
        outstandingBalance: opening,
      },
    });

    return NextResponse.json({
      success: true,
      supplier: {
        ...supplier,
        openingBalance: Number(supplier.openingBalance),
        advanceBalance: Number(supplier.advanceBalance),
        outstandingBalance: Number(supplier.outstandingBalance),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
