export interface EventItem {
  id: string;
  title: string;
  date: string;
  city: string;
  country: string;
  eventbriteUrl: string;
  description: string;
}

export type PastMediaType = 'image' | 'video';

export interface PastEventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  type: PastMediaType;
  thumbnailUrl: string;
  mediaUrl: string;
}

export interface SocialLink {
  id: string;
  platform: 'instagram' | 'facebook';
  label: string;
  handle: string;
  url: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return (await response.json()) as T;
}

export function parseEventDate(input: string): Date {
  return new Date(`${input}T00:00:00`);
}

export function isUpcomingEvent(event: EventItem, today = new Date()): boolean {
  const eventDate = parseEventDate(event.date);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return eventDate >= todayStart;
}

export function sortEventsByDateAsc(events: EventItem[]): EventItem[] {
  return [...events].sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
}

export function getFeaturedUpcomingEvents(events: EventItem[], count = 2): EventItem[] {
  return sortEventsByDateAsc(events).filter((event) => isUpcomingEvent(event)).slice(0, count);
}

export async function loadEvents(): Promise<EventItem[]> {
  return fetchJson<EventItem[]>('/data/events.json');
}

export async function loadPastEvents(): Promise<PastEventItem[]> {
  return fetchJson<PastEventItem[]>('/data/past-events.json');
}

export async function loadSocialLinks(): Promise<SocialLink[]> {
  return fetchJson<SocialLink[]>('/data/socials.json');
}
