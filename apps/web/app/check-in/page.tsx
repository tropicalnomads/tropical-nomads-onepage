import { cookies } from 'next/headers';
import { accountCanScan } from 'tropical-nomads-shared';
import { eventRoster, searchRoster, visibleEvents } from 'tropical-nomads-api/check-in';
import { readSessionSub, sessionCookieName } from '../../src/account/session';
import { loadSnapshot } from '../../src/remote-store';
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
  const snapshot = await loadSnapshot();
  const profile = sub ? snapshot.accounts.profiles.find((item) => item.sub === sub) : undefined;
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
  const partyIds = snapshot.parties.map((party) => party.id).filter((id) => id !== '');
  const titles = new Map(snapshot.titles);
  const events = visibleEvents(staff, snapshot.invites, partyIds).map((id) => ({ id, title: titles.get(id) ?? id }));
  const selected = events.some((event) => event.id === eventId) ? eventId : undefined;
  const roster = selected
    ? eventRoster(
        snapshot.accounts,
        snapshot.invites,
        snapshot.guestLists,
        snapshot.tickets,
        snapshot.orders,
        snapshot.traces,
        snapshot.checkIns,
        staff,
        selected,
        partyIds,
      )
    : undefined;
  const shown = roster && query.trim() !== '' ? searchRoster(roster, query, snapshot.accounts, snapshot.tickets) : roster;
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
