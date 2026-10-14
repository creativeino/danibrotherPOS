import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const state = dbStore.getState();
    return NextResponse.json({ success: true, categories: state.categories || [] });
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

    const state = dbStore.getState();
    if (!state.categories) {
      state.categories = [];
    }

    const existing = state.categories.find(
      c => c.name.toLowerCase().trim() === name.toLowerCase()
    );
    if (existing) {
      return NextResponse.json({
        success: true,
        category: existing,
        message: 'Category already exists',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newCategory = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      description: body.description || '',
      createdAt: new Date().toISOString(),
    };

    state.categories.push(newCategory);

    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: newCategory.id,
      details: JSON.stringify(newCategory),
      createdAt: new Date().toISOString(),
    });

    dbStore.save(state);

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 400 }
    );
  }
}
