import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db';
import { InventoryService } from '@/services/inventory-service';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const state = dbStore.getState();
    const product = state.products.find(p => p.id === resolvedParams.id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const updated = InventoryService.updateProduct(resolvedParams.id, body, userId);
    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';
    const resolvedParams = await Promise.resolve(params);

    InventoryService.deleteProduct(resolvedParams.id, userId);
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
