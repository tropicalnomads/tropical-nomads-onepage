import { cookies } from 'next/headers';
import { readSessionSub, sessionCookieName } from '../../src/account/session';
import { MyOrders } from '../../src/components/MyOrders';
import { loadOwnOrders } from '../../src/orders/load';
import { ownOrderCards } from '../../src/orders/present';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function MyOrdersPage() {
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const orders = ownOrderCards(await loadOwnOrders(sub)).filter((order) => order.purpose === 'shop');
  return <MyOrders signedIn={Boolean(sub)} orders={orders} />;
}
