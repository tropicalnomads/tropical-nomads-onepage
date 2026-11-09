import { getStageSummary } from 'tropical-nomads-shared';
import type { HomeEvent } from './types.ts';

export function upcomingSummary(event: HomeEvent): string {
  const lineupCount = event.stages.reduce((count, stage) => count + stage.artists.length, 0);
  const maxArtists = event.cardArtists.length >= lineupCount ? lineupCount : 4;
  return getStageSummary(event, maxArtists);
}

export function pastSummary(event: HomeEvent): string {
  return getStageSummary(event, 3);
}

export function placeLine(event: Pick<HomeEvent, 'venueName' | 'city' | 'country'>): string {
  return `${event.venueName ? `${event.venueName} - ` : ''}${event.city}, ${event.country}`;
}
