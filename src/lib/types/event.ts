export type EventType =
  | 'Club'
  | 'Open Air'
  | 'Festival'
  | 'Indoor'
  | 'In- & Outdoor'
  | 'Virtual';

export const EVENT_TYPES: readonly EventType[] = [
  'Club',
  'Open Air',
  'Festival',
  'Indoor',
  'In- & Outdoor',
  'Virtual',
];

export interface EventArtist {
  name: string;
  country?: string;
  isoCountry?: string;
  countryFlag?: string;
  genres?: string[];
  agencies?: string[];
  labels?: string[];
  stage?: string;
}

export interface AffiliationOrg {
  id: string;
  name: string;
  url?: string;
  instagram?: string;
  country?: string;
  isoCountry?: string;
}

export interface AgenciesFile {
  schemaVersion: number;
  generatedAt: string;
  count: number;
  agencies: AffiliationOrg[];
}

export interface LabelsFile {
  schemaVersion: number;
  generatedAt: string;
  count: number;
  labels: AffiliationOrg[];
}

export interface Partner {
  id: string;
  name: string;
  city: string;
  handle: string;
  instagram: string;
  logo?: string;
}

export interface PartnersFile {
  schemaVersion: number;
  generatedAt: string;
  count: number;
  partners: Partner[];
}

export interface EventStage {
  name: string;
  genres: string[];
  artists: EventArtist[];
}

export interface MediaLink {
  url: string;
  label?: string;
}

export interface EventMedia {
  photos?: MediaLink[];
  videos?: MediaLink[];
  sets?: MediaLink[];
}

export interface EventVenue {
  id: string;
  name?: string;
  city: string;
  country: string;
  isoCountry: string;
  address?: string;
  geo?: { lat: number; lon: number };
  mapUrl?: string;
}

export interface EventImages {
  bannerLocal?: string;
  small?: string;
  medium?: string;
  large?: string;
  full?: string;
}

export interface EventLinks {
  goabase: string;
  eventbrite?: string;
  tickets?: string;
  instagram?: string[];
}

export interface EventSource {
  provider: 'goabase';
  id: number;
  url: string;
  status?: string;
  dateCreated?: string;
  dateModified?: string;
}

export interface EventRecord {
  id: string;
  title: string;
  type: EventType;
  dateStart: string;
  dateEnd?: string;
  timezone?: string;
  durationHours?: number;
  venue: EventVenue;
  lineupRaw?: string;
  stages: EventStage[];
  cardArtists?: string[];
  partnerIds?: string[];
  media?: EventMedia;
  description?: string;
  organizer?: string;
  images: EventImages;
  links: EventLinks;
  source: EventSource;
}

export interface EventsFile {
  schemaVersion: number;
  generatedAt: string;
  source: { provider: 'goabase'; endpoint: string };
  count: number;
  events: EventRecord[];
}

export interface ArtistsFile {
  schemaVersion: number;
  generatedAt: string;
  count: number;
  artists: EventArtist[];
}

export interface VenuesFile {
  schemaVersion: number;
  generatedAt: string;
  count: number;
  venues: EventVenue[];
}

export function isEventType(value: string): value is EventType {
  return (EVENT_TYPES as readonly string[]).includes(value);
}
