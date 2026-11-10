import { adminActor, loadAdminEventList } from '../../../src/admin/actions';
import { AdminDenied, AdminEventList } from '../../../src/components/AdminEventList';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  return <AdminEventList parties={await loadAdminEventList()} />;
}
