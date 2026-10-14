import { NextRequest, NextResponse } from 'next/server';
import { POSService } from '@/services/pos-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serials = POSService.getAvailableSerials(id);
  return NextResponse.json({ serials });
}
