import { cookies } from 'next/headers';
import { accountCanPurchase, type Locale } from 'tropical-nomads-shared';
import { ownTicketPayload } from 'tropical-nomads-api/tickets';
import { buildTicketPdf } from 'tropical-nomads-api/ticket-pdf';
import { readSessionSub, sessionCookieName } from '../../../src/account/session';
import { loadPublicEvent } from '../../../src/events/load';
import { loadSnapshot } from '../../../src/remote-store';
import { withNoindex } from '../../../src/seo/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ticketIdPattern = /^ticket-[a-f0-9]{18}$/;

function fileName(title: string, owner: string): string {
  const base = `${title} ${owner}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base === '' ? 'ticket' : base}.pdf`;
}

function missing(): Response {
  return withNoindex(new Response(null, { status: 404 }));
}

export async function GET(request: Request): Promise<Response> {
  const ticketId = new URL(request.url).searchParams.get('ticket') ?? '';
  if (!ticketIdPattern.test(ticketId)) {
    return missing();
  }
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const snapshot = await loadSnapshot();
  const profile = sub ? snapshot.accounts.profiles.find((item) => item.sub === sub) : undefined;
  if (!profile || !accountCanPurchase(profile)) {
    return missing();
  }
  try {
    const payload = ownTicketPayload({ role: 'user', actorId: profile.sub }, snapshot.tickets, ticketId, profile.email);
    const parsed = JSON.parse(payload) as { id?: string; secret?: string };
    if (typeof parsed.secret !== 'string') {
      return missing();
    }
    const ticket = snapshot.tickets.find((item) => item.id === ticketId);
    const event = ticket ? await loadPublicEvent(ticket.partyId) : undefined;
    const order = snapshot.orders.find((item) => item.traceId === ticket?.traceId && item.userId === ticket?.buyerId);
    const line = order?.lines.find((item) => item.kind === 'ticket' && item.partyId === ticket?.partyId);
    const offerName = line !== undefined && line.kind === 'ticket' ? line.offerName : '';
    const title = event?.title ?? new Map(snapshot.titles).get(ticket?.partyId ?? '') ?? 'ticket';
    const language: Locale = profile.locale === 'pt' ? 'pt' : 'en';
    const pdf = await buildTicketPdf({
      id: ticketId,
      secret: parsed.secret,
      title,
      offerName,
      ownerName: ticket?.ownerName ?? '',
      language,
      ...(event?.dateStart ? { dateStart: event.dateStart } : {}),
      ...(event?.timezone ? { timezone: event.timezone } : {}),
      ...(event?.durationHours !== undefined ? { durationHours: event.durationHours } : {}),
      ...(event?.venueName ? { venueName: event.venueName } : {}),
      ...(event?.address ? { address: event.address } : {}),
      ...(event?.city ? { city: event.city } : {}),
      ...(event?.country ? { country: event.country } : {}),
    });
    return withNoindex(
      new Response(Buffer.from(pdf), {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${fileName(title, ticket?.ownerName ?? '')}"`,
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
      }),
    );
  } catch {
    return missing();
  }
}
