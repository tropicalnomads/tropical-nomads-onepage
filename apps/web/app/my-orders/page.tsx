import { cookies } from 'next/headers';
import { readSessionSub, sessionCookieName } from '../../src/account/session';
import { MyOrders } from '../../src/components/MyOrders';
import { loadOwnOrders } from '../../src/orders/load';
import { ownOrderCards } from '../../src/orders/present';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const orderIdPattern = /^order-[a-f0-9]{18}$/;

export default async function MyOrdersPage({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
  const params = await searchParams;
  const requested = typeof params.order === 'string' ? params.order : undefined;
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const orders = ownOrderCards(await loadOwnOrders(sub)).filter((order) => order.purpose === 'shop');
  const selectedId = requested !== undefined && orderIdPattern.test(requested) ? requested : undefined;
  return <MyOrders signedIn={Boolean(sub)} orders={orders} selectedId={selectedId} />;
}
