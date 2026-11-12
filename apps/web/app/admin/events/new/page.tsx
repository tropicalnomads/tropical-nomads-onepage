import { adminActor } from '../../../../src/admin/actions';
import { emptyEventValues } from '../../../../src/admin/values';
import { loadArtistProfiles } from '../../../../src/artists/load';
import { loadVenues } from '../../../../src/venues/load';
import { AdminEventForm } from '../../../../src/components/AdminEventForm';
import { AdminDenied } from '../../../../src/components/AdminEventList';

export const dynamic = 'force-dynamic';

export default async function NewAdminEventPage() {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  return <AdminEventForm values={emptyEventValues()} artists={await loadArtistProfiles()} venues={await loadVenues()} sold={{}} phase="draft" />;
}
