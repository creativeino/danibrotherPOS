import { dbStore } from '@/lib/db';
import { ensureDatabaseSeeded } from '@/lib/init';
import { NextResponse } from 'next/server';

ensureDatabaseSeeded();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const state = dbStore.getState();

  const query = q.trim().toLowerCase();
  const products = state.products.filter(p => {
    if (!p.active) return false;
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.barcode.toLowerCase() === query ||
      p.sku.toLowerCase().includes(query) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(query))
    );
  });

  return NextResponse.json({ products });
}
