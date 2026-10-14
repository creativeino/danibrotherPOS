import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> | { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const resolved = await Promise.resolve(params);
    const supplier = await prisma.supplier.findUnique({
      where: { id: resolved.id },
    });
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const resolved = await Promise.resolve(params);
    const body = await req.json();

    const updateData: any = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.companyName !== undefined) updateData.companyName = body.companyName?.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.outstandingBalance !== undefined) updateData.outstandingBalance = Number(body.outstandingBalance) || 0;
    if (body.openingBalance !== undefined) updateData.openingBalance = Number(body.openingBalance) || 0;

    const updated = await prisma.supplier.update({
      where: { id: resolved.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      supplier: {
        ...updated,
        openingBalance: Number(updated.openingBalance),
        advanceBalance: Number(updated.advanceBalance),
        outstandingBalance: Number(updated.outstandingBalance),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const resolved = await Promise.resolve(params);
    await prisma.supplier.delete({
      where: { id: resolved.id },
    });
    return NextResponse.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
