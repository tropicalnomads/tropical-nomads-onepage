import { eventRoster } from 'tropical-nomads-api/check-in';
import { assignEventSlugs, loteOffers, readTicketOffers } from 'tropical-nomads-shared';
import { adminActor, loadAdminEventList } from '../../../../src/admin/actions';
import { buildEventDashboard } from '../../../../src/admin/event-dashboard';
import { eventPhase } from '../../../../src/admin/event-board';
import { participantRows, type ParticipantRow } from '../../../../src/admin/event-participants';
import { eventValues, guestListFields } from '../../../../src/admin/values';
import { ensuredGuestLists } from '../../../../src/check-in/actions';
import { loadArtistProfiles } from '../../../../src/artists/load';
import { loadVenues } from '../../../../src/venues/load';
import { AdminEventForm } from '../../../../src/components/AdminEventForm';
import { AdminDenied } from '../../../../src/components/AdminEventList';
import { loadTicketSales } from '../../../../src/events/load';
import { loadAllOrders } from '../../../../src/orders/load';
import { adminOrderCards } from '../../../../src/orders/present';
import { loadSnapshot } from '../../../../src/remote-store';

export const dynamic = 'force-dynamic';

export default async function EditAdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  const { id } = await params;
  const parties = await loadAdminEventList();
  const party = parties.find((item) => item.id === id);
  if (!party) {
    return <AdminDenied />;
  }
  const publicSlug =
    assignEventSlugs(
      parties.map((item) => {
        const slug = item.event.slug?.trim() ?? '';
        return { id: item.id, title: item.event.title, ...(slug === '' ? {} : { slug }) };
      }),
    ).get(party.id) ?? party.id;
  const [sales, lists, artists, venues, orders, snapshot] = await Promise.all([
    loadTicketSales(),
    ensuredGuestLists(party.id, actor),
    loadArtistProfiles(),
    loadVenues(),
    loadAllOrders(),
    loadSnapshot().catch(() => undefined),
  ]);
  let participants: ParticipantRow[] = [];
  if (snapshot) {
    try {
      const roster = eventRoster(
        snapshot.accounts,
        snapshot.invites,
        lists,
        snapshot.tickets,
        snapshot.orders,
        snapshot.traces,
        snapshot.checkIns,
        actor,
        party.id,
        snapshot.eventIds,
      );
      participants = participantRows(
        roster.sold,
        roster.guests,
        snapshot.tickets
          .filter((ticket) => ticket.partyId === party.id)
          .map((ticket) => ({
            ticketId: ticket.id,
            name: ticket.ownerName?.trim() ?? '',
            email: ticket.ownerEmail?.trim() ?? '',
          })),
      );
    } catch {
      participants = [];
    }
  }
  const sold: Record<string, number> = {};
  for (const sale of sales) {
    if (sale.partyId === party.id) {
      sold[sale.offerName] = sale.sold;
    }
  }
  const dashboard = buildEventDashboard({
    partyId: party.id,
    offers: loteOffers(readTicketOffers(party.event.offers)),
    sold,
    orders: adminOrderCards(orders),
    now: new Date(),
    timeZone: party.event.timezone ?? '',
  });
  return (
    <AdminEventForm
      values={eventValues(party)}
      artists={artists}
      venues={venues}
      sold={sold}
      phase={eventPhase({ publication: party.publication, event: party.event })}
      initialGuestLists={guestListFields(
        lists.filter((list) => list.partyId === party.id),
        sold,
      )}
      dashboard={dashboard}
      participants={participants}
      publicSlug={publicSlug}
    />
  );
}
