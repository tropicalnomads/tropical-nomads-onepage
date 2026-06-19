import { useEffect, useMemo, useState } from 'react';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { FeaturedEvents } from '@/components/FeaturedEvents';
import { UpcomingEventsList } from '@/components/UpcomingEventsList';
import { PastEventsGallery } from '@/components/PastEventsGallery';
import { SocialLinks } from '@/components/SocialLinks';
import { LightboxModal } from '@/components/LightboxModal';
import { EmptyState } from '@/components/EmptyState';
import {
  getFeaturedUpcomingEvents,
  isUpcomingEvent,
  loadEvents,
  loadPastEvents,
  loadSocialLinks,
  sortEventsByDateAsc,
  type EventItem,
  type PastEventItem,
  type SocialLink,
} from '@/lib/data';

interface AppDataState {
  events: EventItem[];
  pastEvents: PastEventItem[];
  socialLinks: SocialLink[];
}

const initialDataState: AppDataState = {
  events: [],
  pastEvents: [],
  socialLinks: [],
};

export default function App(): JSX.Element {
  const [data, setData] = useState<AppDataState>(initialDataState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<PastEventItem | null>(null);

  useEffect(() => {
    let active = true;

    async function run(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const [events, pastEvents, socialLinks] = await Promise.all([loadEvents(), loadPastEvents(), loadSocialLinks()]);
        if (!active) {
          return;
        }
        setData({ events, pastEvents, socialLinks });
      } catch {
        if (!active) {
          return;
        }
        setError('Unable to load events data right now.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    run().catch(() => {
      if (active) {
        setError('Unable to load events data right now.');
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const upcomingEvents = useMemo(
    () => sortEventsByDateAsc(data.events).filter((event) => isUpcomingEvent(event)),
    [data.events],
  );
  const featuredEvents = useMemo(() => getFeaturedUpcomingEvents(data.events, 2), [data.events]);

  const handleExploreEvents = (): void => {
    document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen text-ozora-cream">
      <HeroSection onExploreEvents={handleExploreEvents} />

      {isLoading ? (
        <main className="safe-x mx-auto max-w-5xl px-4 pb-16 md:px-8">
          <EmptyState title="Loading events..." description="Fetching upcoming and past events." />
        </main>
      ) : error ? (
        <main className="safe-x mx-auto max-w-5xl px-4 pb-16 md:px-8">
          <EmptyState title="Could not load content" description={error} />
        </main>
      ) : (
        <main className="space-y-4 pb-12">
          <FeaturedEvents events={featuredEvents} />
          <UpcomingEventsList events={upcomingEvents} />
          <PastEventsGallery items={data.pastEvents} onOpenPreview={setLightboxItem} />
          <SocialLinks links={data.socialLinks} />
        </main>
      )}

      <Footer />
      <LightboxModal item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  );
}
