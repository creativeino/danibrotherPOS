import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, categories });
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
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        category: existing,
        message: 'Category already exists',
      });
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug || `cat-${Date.now()}`;
    const slugExists = await prisma.category.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description: body.description || null,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CATEGORY_CREATED',
          entityType: 'Category',
          entityId: newCategory.id,
          details: JSON.stringify(newCategory),
        },
      });
    } catch {
      // audit log failure should not break response
    }

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 400 }
    );
  }
}
