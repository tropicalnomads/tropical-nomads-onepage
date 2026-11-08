import { UpcomingEvents } from '../../src/components/UpcomingEvents';
import { loadUpcomingEvents } from '../../src/events/load';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function UpcomingEventsPage() {
  const events = await loadUpcomingEvents();
  return (
    <main>
      <UpcomingEvents events={events} />
    </main>
  );
}
