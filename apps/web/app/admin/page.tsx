import { redirect } from 'next/navigation';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const params = await searchParams;
  redirect(params.tab === 'shop' ? '/admin/shops' : '/admin/events');
}
