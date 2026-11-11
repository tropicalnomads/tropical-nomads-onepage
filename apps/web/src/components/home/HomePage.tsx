'use client';

import type { HomeEvent, HomePartner, HomeSocial } from '../../home/types';
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
  return (
    <>
      <HeroCard followHref={followHref} />
      <UpcomingSection events={upcoming} partners={partners} />
      <PastSection events={past} />
      <PartnersSection partners={partners} />
      <StayConnected links={socials} />
    </>
  );
}
