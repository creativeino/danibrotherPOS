import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  const id = resolved?.id ? encodeURIComponent(resolved.id) : '';
  redirect(`/invoices/${id}/print`);
}
