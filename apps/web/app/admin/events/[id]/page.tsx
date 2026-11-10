import { adminActor, loadAdminEventList } from '../../../../src/admin/actions';
import { eventValues } from '../../../../src/admin/values';
import { AdminEventForm } from '../../../../src/components/AdminEventForm';
import { AdminDenied, AdminEventEditor } from '../../../../src/components/AdminEventList';

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
  return (
    <AdminEventEditor heading="editEvent" publication={party.publication}>
      <AdminEventForm values={eventValues(party)} />
    </AdminEventEditor>
  );
}
