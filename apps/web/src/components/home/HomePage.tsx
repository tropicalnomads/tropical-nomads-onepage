'use client';

import { useCallback, useState } from 'react';
import type { HomeEvent, HomePartner, HomeSocial } from '../../home/types';
import { EventDetails } from './EventDetails';
import { HeroCard } from './HeroCard';
import { PartnersSection } from './PartnersSection';
import { PastSection } from './PastSection';
import { StayConnected } from './StayConnected';
import { UpcomingSection } from './UpcomingSection';

export function HomePage({
  upcoming,
  past,
  partners,
  socials,
  followHref,
}: {
  upcoming: readonly HomeEvent[];
  past: readonly HomeEvent[];
  partners: readonly HomePartner[];
  socials: readonly HomeSocial[];
  followHref: string;
}) {
  const [preview, setPreview] = useState<HomeEvent | null>(null);
  const closePreview = useCallback((): void => {
    setPreview(null);
  }, []);

  return (
    <>
      <HeroCard followHref={followHref} />
      <UpcomingSection events={upcoming} partners={partners} />
      <PastSection events={past} onOpenPreview={setPreview} />
      <PartnersSection partners={partners} />
      <StayConnected links={socials} />
      <EventDetails event={preview} onClose={closePreview} />
    </>
  );
}
