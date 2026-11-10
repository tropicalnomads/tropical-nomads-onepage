import { adminActor } from '../../../../src/admin/actions';
import { emptyEventValues } from '../../../../src/admin/values';
import { AdminEventForm } from '../../../../src/components/AdminEventForm';
import { AdminDenied, AdminEventEditor } from '../../../../src/components/AdminEventList';

export const dynamic = 'force-dynamic';

export default async function NewAdminEventPage() {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  return (
    <AdminEventEditor heading="newEvent">
      <AdminEventForm values={emptyEventValues()} />
    </AdminEventEditor>
  );
}
