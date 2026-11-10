import type { Metadata } from 'next';
import { UpcomingEvents } from '../../src/components/UpcomingEvents';
import { loadUpcomingEvents } from '../../src/events/load';
import { publicMetadata } from '../../src/seo/metadata';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }): Promise<Metadata> {
  const params = await searchParams;
  return publicMetadata('/upcoming-events', params.lang);
}

export default async function UpcomingEventsPage() {
  const events = await loadUpcomingEvents();
  return (
    <main>
      <UpcomingEvents events={events} />
    </main>
  );
}
