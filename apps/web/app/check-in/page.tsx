import { cookies } from 'next/headers';
import { accountCanScan } from 'tropical-nomads-shared';
import { readAccounts } from 'tropical-nomads-api/accounts';
import { readDoorInvites, rosterFor, searchRoster, visibleEvents } from 'tropical-nomads-api/check-in';
import { publishedParties, publishedPartyTitles, readIssuedTickets } from 'tropical-nomads-api/tickets';
import { readSessionSub, sessionCookieName } from '../../src/account/session';
import { CheckInDesk } from '../../src/components/CheckInDesk';
import { CheckInGate } from '../../src/components/CheckInGate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ event?: string | string[]; q?: string | string[] }> }) {
  const params = await searchParams;
  const eventId = typeof params.event === 'string' ? params.event : '';
  const query = typeof params.q === 'string' ? params.q : '';
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  const profile = sub ? readAccounts().profiles.find((item) => item.sub === sub) : undefined;
  const staff =
    profile && profile.status === 'active' && profile.role === 'admin'
      ? { role: 'admin' as const, actorId: profile.sub }
      : profile && profile.status === 'active' && profile.role === 'door' && accountCanScan(profile)
        ? { role: 'door' as const, actorId: profile.sub }
        : undefined;
  if (!staff) {
    return (
      <main>
        <CheckInGate signedIn={Boolean(profile)} />
      </main>
    );
  }
  const partyIds = publishedParties()
    .map((party) => party.id)
    .filter((id) => id !== '');
  const titles = publishedPartyTitles();
  const events = visibleEvents(staff, readDoorInvites(), partyIds).map((id) => ({ id, title: titles.get(id) ?? id }));
  const selected = events.some((event) => event.id === eventId) ? eventId : undefined;
  const roster = selected ? rosterFor(staff, selected, partyIds) : undefined;
  const shown = roster && query.trim() !== '' ? searchRoster(roster, query, readAccounts(), readIssuedTickets()) : roster;
  return (
    <main className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <CheckInDesk
          events={events}
          partyId={selected}
          query={query}
          admin={staff.role === 'admin'}
          sold={shown?.sold ?? []}
          guests={shown?.guests ?? []}
          lists={roster?.lists ?? []}
        />
      </div>
    </main>
  );
}
