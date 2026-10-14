import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/services/inventory-service';
import { productSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'usr-danish';

    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid product data' },
        { status: 400 }
      );
    }

    const created = InventoryService.createProduct(parsed.data, userId);

    return NextResponse.json({ success: true, product: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 400 });
  }
}
