import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, brands });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const body = await req.json();

    const name = (body.name || '').trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Brand name is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.brand.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        brand: existing,
        message: 'Brand already exists',
      });
    }

    const newBrand = await prisma.brand.create({
      data: {
        name,
        description: body.description || null,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BRAND_CREATED',
          entityType: 'Brand',
          entityId: newBrand.id,
          details: JSON.stringify(newBrand),
        },
      });
    } catch {
      // audit log optional
    }

    return NextResponse.json({ success: true, brand: newBrand });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 400 }
    );
  }
}
