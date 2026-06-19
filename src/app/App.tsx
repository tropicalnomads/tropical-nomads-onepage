import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { UpcomingEventsList } from '@/components/UpcomingEventsList';
import { PastEventsGallery } from '@/components/PastEventsGallery';
import { SocialLinks } from '@/components/SocialLinks';
import { LightboxModal } from '@/components/LightboxModal';
import { EmptyState } from '@/components/EmptyState';
import {
  getPastEvents,
  getUpcomingEvents,
  loadEvents,
  loadSocialLinks,
  type EventRecord,
  type SocialLink,
} from '@/lib/data';

interface AppDataState {
  events: EventRecord[];
  socialLinks: SocialLink[];
}

const initialDataState: AppDataState = {
  events: [],
  socialLinks: [],
};

export default function App(): JSX.Element {
  const [data, setData] = useState<AppDataState>(initialDataState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxEvent, setLightboxEvent] = useState<EventRecord | null>(null);

  useEffect(() => {
    let active = true;

    async function run(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const [events, socialLinks] = await Promise.all([loadEvents(), loadSocialLinks()]);
        if (!active) {
          return;
        }
        setData({ events, socialLinks });
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

  const upcomingEvents = useMemo(() => getUpcomingEvents(data.events), [data.events]);
  const pastEvents = useMemo(() => getPastEvents(data.events), [data.events]);

  const handleScrollTo = (id: string): void => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen text-ozora-cream">
      <SiteHeader onNavigate={handleScrollTo} />
      <HeroSection onExploreEvents={() => handleScrollTo('upcoming-events')} />

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
          <UpcomingEventsList events={upcomingEvents} />
          <PastEventsGallery events={pastEvents} onOpenPreview={setLightboxEvent} />
          <SocialLinks links={data.socialLinks} />
        </main>
      )}

      <Footer onNavigate={handleScrollTo} />
      <LightboxModal event={lightboxEvent} onClose={() => setLightboxEvent(null)} />
    </div>
  );
}
