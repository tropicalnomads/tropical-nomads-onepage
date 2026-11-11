import type { Metadata } from 'next';
import { EventCalendar } from '../../src/components/EventCalendar';
import { loadArtistProfiles } from '../../src/artists/load';
import { loadCalendarEvents } from '../../src/events/load';
import { publicMetadata } from '../../src/seo/metadata';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }): Promise<Metadata> {
  const params = await searchParams;
  return publicMetadata('/upcoming-events', params.lang);
}

export default async function CalendarPage() {
  const [events, artists] = await Promise.all([loadCalendarEvents(), loadArtistProfiles()]);
  const artistPreviews = Object.fromEntries(artists.map((artist) => [artist.name.trim().toLowerCase(), artist]));
  return (
    <main>
      <EventCalendar events={events} artistPreviews={artistPreviews} />
    </main>
  );
}
