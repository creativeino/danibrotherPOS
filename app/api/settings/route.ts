import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const settings = dbStore.getState().settings;
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const body = await req.json();

    const state = dbStore.getState();
    const nowIso = new Date().toISOString();

    state.settings = {
      ...state.settings,
      ...body,
      updatedAt: nowIso,
    };

    state.auditLogs.push({
      id: `aud-${Date.now()}`,
      userId,
      action: 'SETTINGS_UPDATED',
      entityType: 'Settings',
      entityId: state.settings.id || 'default-shop',
      details: JSON.stringify(body),
      createdAt: nowIso,
    });

    dbStore.save(state);

    return NextResponse.json({ success: true, settings: state.settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
