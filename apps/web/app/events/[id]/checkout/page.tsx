import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ticketOwnerLimit } from 'tropical-nomads-shared';
import { accountIdentity } from '../../../../src/account/profile-form';
import { profileSetupHref, signInHref } from '../../../../src/account/return-path';
import { readSessionSub, sessionCookieName } from '../../../../src/account/session';
import { TicketCheckout } from '../../../../src/components/TicketCheckout';
import { loadPublicEvent } from '../../../../src/events/load';
import { currentAccounts } from '../../../../src/remote-store';
import { ticketCheckoutPath } from '../../../../src/tickets/checkout-path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function one(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

function readQuantity(value: string, cap: number): number | undefined {
  if (!/^\d{1,2}$/.test(value)) {
    return undefined;
  }
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > cap) {
    return undefined;
  }
  return quantity;
}

export default async function TicketCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ offer?: string | string[]; qty?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const event = await loadPublicEvent(id);
  if (!event) {
    notFound();
  }
  const eventHref = `/events/${encodeURIComponent(event.id)}`;
  const offer = event.inAppOffers.find((item) => item.name === one(query.offer));
  const cap = offer ? Math.min(ticketOwnerLimit, offer.remaining) : 0;
  const quantity = offer ? readQuantity(one(query.qty), cap) : undefined;
  if (!offer || quantity === undefined) {
    redirect(eventHref);
  }
  const next = ticketCheckoutPath(event.id, offer.name, quantity);
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  if (!sub) {
    redirect(signInHref(next));
  }
  const profile = (await currentAccounts()).profiles.find((item) => item.sub === sub);
  if (!profile) {
    redirect(profileSetupHref(next));
  }
  return (
    <main>
      <TicketCheckout
        eventId={event.id}
        title={event.title}
        offerName={offer.name}
        amount={offer.amount}
        quantity={quantity}
        buyer={{ fullName: accountIdentity(profile), email: profile.email }}
      />
    </main>
  );
}
