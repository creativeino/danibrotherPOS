import { redirect } from 'next/navigation';
import { dbStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function InvoicesPrintCatchAllPage() {
  const sales = dbStore.getState().sales || [];
  if (sales.length > 0) {
    const latest = sales[sales.length - 1];
    redirect(`/invoices/${latest.id}/print`);
  }
  redirect('/invoices');
}
