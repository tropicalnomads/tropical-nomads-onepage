import { adminActor, loadAdminEventList } from '../../../../src/admin/actions';
import { eventPhase } from '../../../../src/admin/event-board';
import { eventValues } from '../../../../src/admin/values';
import { loadArtistProfiles } from '../../../../src/artists/load';
import { AdminEventForm } from '../../../../src/components/AdminEventForm';
import { AdminDenied } from '../../../../src/components/AdminEventList';
import { loadTicketSales } from '../../../../src/events/load';

export const dynamic = 'force-dynamic';

export default async function EditAdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  const { id } = await params;
  const party = (await loadAdminEventList()).find((item) => item.id === id);
  if (!party) {
    return <AdminDenied />;
  }
  const sales = await loadTicketSales();
  const sold: Record<string, number> = {};
  for (const sale of sales) {
    if (sale.partyId === party.id) {
      sold[sale.offerName] = sale.sold;
    }
  }
  return (
    <AdminEventForm
      values={eventValues(party)}
      artists={await loadArtistProfiles()}
      sold={sold}
      phase={eventPhase({ publication: party.publication, event: party.event })}
    />
  );
}
