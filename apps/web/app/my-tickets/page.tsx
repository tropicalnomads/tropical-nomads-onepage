import { cookies } from 'next/headers';
import { accountCanPurchase } from 'tropical-nomads-shared';
import { ownTicketPayload, ownTicketViews } from 'tropical-nomads-api/tickets';
import { readSessionSub, sessionCookieName } from '../../src/account/session';
import { loadSnapshot } from '../../src/remote-store';
import { MyTickets, type TicketRow } from '../../src/components/MyTickets';
import { ticketQrSvg } from '../../src/tickets/qr';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ticketIdPattern = /^ticket-[a-f0-9]{18}$/;

export default async function MyTicketsPage({ searchParams }: { searchParams: Promise<{ ticket?: string | string[] }> }) {
  const params = await searchParams;
  const requested = typeof params.ticket === 'string' ? params.ticket : undefined;
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const snapshot = await loadSnapshot();
  const profile = sub ? snapshot.accounts.profiles.find((item) => item.sub === sub) : undefined;
  const caller = profile && accountCanPurchase(profile) ? { role: 'user' as const, actorId: profile.sub } : undefined;
  if (!caller) {
    return <MyTickets signedIn={Boolean(sub)} tickets={[]} />;
  }
  const tickets = snapshot.tickets;
  const views = ownTicketViews(caller, tickets, snapshot.orders, new Map(snapshot.titles));
  const rows: TicketRow[] = [];
  for (const view of views) {
    const open = requested !== undefined && requested === view.id && ticketIdPattern.test(view.id);
    const row: TicketRow = { id: view.id, title: view.title, offerName: view.offerName, createdAt: view.createdAt, ready: view.validForEntry };
    if (open) {
      row.qrSvg = await ticketQrSvg(JSON.parse(ownTicketPayload(caller, tickets, view.id)) as unknown);
    }
    rows.push(row);
  }
  return <MyTickets signedIn tickets={rows} />;
}
