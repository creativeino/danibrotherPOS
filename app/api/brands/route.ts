import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const state = dbStore.getState();
    return NextResponse.json({ success: true, brands: state.brands || [] });
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

    const state = dbStore.getState();
    if (!state.brands) {
      state.brands = [];
    }

    // Check duplicate brand
    const existing = state.brands.find(
      b => b.name.toLowerCase().trim() === name.toLowerCase()
    );
    if (existing) {
      return NextResponse.json({
        success: true,
        brand: existing,
        message: 'Brand already exists',
      });
    }

    const newBrand = {
      id: `br-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };

    state.brands.push(newBrand);

    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId,
      action: 'BRAND_CREATED',
      entityType: 'Brand',
      entityId: newBrand.id,
      details: JSON.stringify(newBrand),
      createdAt: new Date().toISOString(),
    });

    dbStore.save(state);

    return NextResponse.json({ success: true, brand: newBrand });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 400 }
    );
  }
}
