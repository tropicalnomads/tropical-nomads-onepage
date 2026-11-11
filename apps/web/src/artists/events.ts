import { publicHttpsUrl } from 'tropical-nomads-shared';
import { uploadedEventFlyer } from '../admin/event-image.ts';
import { bannerSrc } from '../events/assets.ts';
import type { ArtistEventCard } from './profile.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function artistKey(name: string): string {
  return name.trim().toLowerCase();
}

function sameArtist(name: string, artistName: string): boolean {
  const wanted = artistKey(artistName);
  return wanted !== '' && artistKey(name) === wanted;
}

function listedNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const names: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      const name = item.trim();
      if (name !== '') {
        names.push(name);
      }
      continue;
    }
    if (isRecord(item)) {
      const name = text(item.name);
      if (name !== '') {
        names.push(name);
      }
    }
  }
  return names;
}

function stageNamesFor(item: Record<string, unknown>, artistName: string): string[] {
  if (!Array.isArray(item.stages)) {
    return [];
  }
  const seen = new Set<string>();
  const names: string[] = [];
  for (const stage of item.stages) {
    if (!isRecord(stage) || !listedNames(stage.artists).some((name) => sameArtist(name, artistName))) {
      continue;
    }
    const stageName = text(stage.name);
    const key = artistKey(stageName);
    if (stageName === '' || seen.has(key)) {
      continue;
    }
    seen.add(key);
    names.push(stageName);
  }
  return names;
}

function eventIncludesArtist(item: Record<string, unknown>, artistName: string): boolean {
  const cardNames = Array.isArray(item.cardArtists) ? item.cardArtists.filter((name): name is string => typeof name === 'string') : [];
  const stageNames = Array.isArray(item.stages) ? item.stages.flatMap((stage) => (isRecord(stage) ? listedNames(stage.artists) : [])) : [];
  return [...cardNames, ...stageNames].some((name) => sameArtist(name, artistName));
}

function optionalInstant(value: unknown): string | undefined {
  const raw = text(value);
  if (raw === '' || Number.isNaN(new Date(raw).getTime())) {
    return undefined;
  }
  return raw;
}

function httpsField(value: unknown): string | undefined {
  const raw = text(value);
  return raw === '' ? undefined : publicHttpsUrl(raw);
}

function ticketUrlFor(links: Record<string, unknown>): string | undefined {
  return httpsField(links.eventbrite) ?? httpsField(links.tickets);
}

function flyerFor(images: Record<string, unknown>): string | undefined {
  const full = text(images.full);
  return uploadedEventFlyer(full) ?? bannerSrc(text(images.bannerLocal)) ?? publicHttpsUrl(full);
}

function durationFor(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

export function artistEventHistory(body: unknown, artistName: string, now: Date): { upcoming: ArtistEventCard[]; past: ArtistEventCard[] } {
  if (!isRecord(body) || !Array.isArray(body.events) || artistKey(artistName) === '') {
    return { upcoming: [], past: [] };
  }
  const seen = new Set<string>();
  const cards: ArtistEventCard[] = [];
  for (const item of body.events) {
    if (!isRecord(item) || text(item.title) === '' || text(item.id) === '' || !eventIncludesArtist(item, artistName)) {
      continue;
    }
    const id = text(item.id);
    if (seen.has(id)) {
      continue;
    }
    const date = optionalInstant(item.dateStart);
    if (!date) {
      continue;
    }
    seen.add(id);
    const start = new Date(date);
    const venue = isRecord(item.venue) ? item.venue : {};
    const images = isRecord(item.images) ? item.images : {};
    const links = isRecord(item.links) ? item.links : {};
    const venueName = text(venue.name);
    const city = text(venue.city);
    const country = text(venue.country);
    const place = [venueName, city].filter((part) => part !== '').join(', ');
    const flyer = flyerFor(images);
    const dateEnd = optionalInstant(item.dateEnd);
    const timezone = text(item.timezone);
    const durationHours = durationFor(item.durationHours);
    const mapUrl = httpsField(venue.mapUrl);
    const ticketUrl = ticketUrlFor(links);
    const headliner = listedNames(item.headliners).some((name) => sameArtist(name, artistName));
    cards.push({
      id,
      title: text(item.title),
      date,
      when: date,
      place,
      href: `/events/${encodeURIComponent(id)}`,
      stageNames: stageNamesFor(item, artistName),
      ...(flyer ? { flyer } : {}),
      ...(venueName ? { venue: venueName } : {}),
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
      ...(dateEnd ? { dateEnd } : {}),
      ...(timezone ? { timezone } : {}),
      ...(durationHours !== undefined ? { durationHours } : {}),
      ...(mapUrl ? { mapUrl } : {}),
      ...(ticketUrl ? { ticketUrl } : {}),
      ...(headliner ? { headliner: true } : {}),
      upcoming: start.getTime() >= now.getTime(),
    });
  }
  return {
    upcoming: cards.filter((card) => card.upcoming).sort((left, right) => left.when.localeCompare(right.when)),
    past: cards.filter((card) => !card.upcoming).sort((left, right) => right.when.localeCompare(left.when)),
  };
}
