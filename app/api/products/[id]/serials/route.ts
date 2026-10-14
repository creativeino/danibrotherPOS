import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serials = await prisma.productSerialNumber.findMany({
    where: { productId: id, status: 'AVAILABLE' },
    select: { serialNumber: true },
    orderBy: { serialNumber: 'asc' },
  });
  return NextResponse.json({ serials: serials.map(s => s.serialNumber) });
}
