import {
  fail,
  finish,
  isRecord,
  optionalString,
  readRecord,
  rejectSensitive,
  rejectUnknown,
  requireFinite,
  requireString,
  type ParseResult,
} from './result.ts';
import { parseEnum, partyTypes, requireRef, type PartyType, type SchemaRefs } from './values.ts';

export const partyFields = [
  'id',
  'title',
  'type',
  'dateStart',
  'dateEnd',
  'timezone',
  'durationHours',
  'venue',
  'lineupRaw',
  'stages',
  'cardArtists',
  'partnerIds',
  'timetableFestivalId',
  'media',
  'description',
  'organizer',
  'images',
  'links',
  'source',
  'offers',
] as const;

export interface Venue {
  id: string;
  name?: string;
  city?: string;
  country?: string;
  isoCountry?: string;
  address?: string;
  geo?: { lat: number; lon: number };
  mapUrl?: string;
}

export interface StageArtist {
  name: string;
  country?: string;
  isoCountry?: string;
  countryFlag?: string;
  genres?: readonly string[];
  agencies?: readonly string[];
  labels?: readonly string[];
  stage?: string;
}

export interface Stage {
  name: string;
  genres: readonly string[];
  artists: readonly StageArtist[];
}

export interface PartyLinks {
  goabase: string;
  eventbrite?: string;
  tickets?: string;
  instagram?: readonly string[];
  instagramPost?: string;
}

export interface PartyOffer {
  name: string;
  amount: number;
  currency?: string;
  capacity?: number;
}

export interface Party {
  id: string;
  title: string;
  type?: PartyType;
  dateStart: string;
  dateEnd?: string;
  timezone?: string;
  durationHours?: number;
  venue: Venue;
  lineupRaw?: string;
  stages?: readonly Stage[];
  cardArtists?: readonly string[];
  partnerIds?: readonly string[];
  timetableFestivalId?: string;
  media?: { photos?: readonly { url: string; label?: string }[]; videos?: readonly { url: string; label?: string }[]; sets?: readonly { url: string; label?: string }[] };
  description?: string;
  organizer?: string;
  images?: { bannerLocal?: string; small?: string; medium?: string; large?: string; full?: string };
  links: PartyLinks;
  source?: { provider: 'goabase'; id: number; url: string };
  offers?: readonly PartyOffer[];
}

export interface Artist extends StageArtist {
  id: string;
}

export interface Partner {
  id: string;
  name: string;
  city: string;
  handle: string;
  instagram: string;
}

export interface Affiliation {
  id: string;
  name: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  handle: string;
  url: string;
}

export interface CalendarEntry {
  id: string;
  artistId: string;
  partyId: string;
}

const datePattern = /^\d{4}-\d{2}-\d{2}/;

function stringList(value: unknown, field: string, errors: string[]): string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
    errors.push(`${field} must be a list of strings`);
    return undefined;
  }
  return value;
}

function parseVenue(value: unknown, errors: string[]): Venue | undefined {
  if (!isRecord(value)) {
    errors.push('venue is required');
    return undefined;
  }
  rejectUnknown(value, ['id', 'name', 'city', 'country', 'isoCountry', 'address', 'geo', 'mapUrl'], errors);
  rejectSensitive(value, errors);
  const id = requireString(value, 'id', errors);
  const name = optionalString(value, 'name', errors);
  const city = optionalString(value, 'city', errors);
  const country = optionalString(value, 'country', errors);
  const isoCountry = optionalString(value, 'isoCountry', errors);
  const address = optionalString(value, 'address', errors);
  const mapUrl = optionalString(value, 'mapUrl', errors);
  let geo: Venue['geo'];
  if ('geo' in value && value.geo !== undefined) {
    if (!isRecord(value.geo)) {
      errors.push('geo must be lat and lon');
    } else {
      const lat = requireFinite(value.geo, 'lat', errors);
      const lon = requireFinite(value.geo, 'lon', errors);
      if (lat !== undefined && lon !== undefined) {
        geo = { lat, lon };
      }
    }
  }
  if (!id) {
    return undefined;
  }
  return { id, name, city, country, isoCountry, address, geo, mapUrl };
}

function parseLinks(value: unknown, errors: string[]): PartyLinks | undefined {
  if (!isRecord(value)) {
    errors.push('links is required');
    return undefined;
  }
  rejectUnknown(value, ['goabase', 'eventbrite', 'tickets', 'instagram', 'instagramPost'], errors);
  const goabase = requireString(value, 'goabase', errors);
  const eventbrite = optionalString(value, 'eventbrite', errors);
  const tickets = optionalString(value, 'tickets', errors);
  const instagramPost = optionalString(value, 'instagramPost', errors);
  let instagram: string[] | undefined;
  if ('instagram' in value && value.instagram !== undefined) {
    instagram = stringList(value.instagram, 'instagram', errors);
  }
  if (!goabase) {
    return undefined;
  }
  return { goabase, eventbrite, tickets, instagram, instagramPost };
}

function parseStageArtist(value: unknown, errors: string[]): StageArtist | undefined {
  if (!isRecord(value)) {
    errors.push('artist must be an object');
    return undefined;
  }
  rejectUnknown(value, ['name', 'country', 'isoCountry', 'countryFlag', 'genres', 'agencies', 'labels', 'stage'], errors);
  rejectSensitive(value, errors);
  const name = requireString(value, 'name', errors);
  if (!name) {
    return undefined;
  }
  const artist: StageArtist = { name };
  const country = optionalString(value, 'country', errors);
  const isoCountry = optionalString(value, 'isoCountry', errors);
  const countryFlag = optionalString(value, 'countryFlag', errors);
  const stage = optionalString(value, 'stage', errors);
  if (country) artist.country = country;
  if (isoCountry) artist.isoCountry = isoCountry;
  if (countryFlag) artist.countryFlag = countryFlag;
  if (stage) artist.stage = stage;
  if ('genres' in value && value.genres !== undefined) {
    const genres = stringList(value.genres, 'genres', errors);
    if (genres) artist.genres = genres;
  }
  if ('agencies' in value && value.agencies !== undefined) {
    const agencies = stringList(value.agencies, 'agencies', errors);
    if (agencies) artist.agencies = agencies;
  }
  if ('labels' in value && value.labels !== undefined) {
    const labels = stringList(value.labels, 'labels', errors);
    if (labels) artist.labels = labels;
  }
  return artist;
}

export function parseParty(input: unknown): ParseResult<Party> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const record = read.value;
  const errors: string[] = [];
  rejectUnknown(record, partyFields, errors);
  rejectSensitive(record, errors);
  const id = requireString(record, 'id', errors);
  const title = requireString(record, 'title', errors);
  const dateStart = requireString(record, 'dateStart', errors);
  if (dateStart && !datePattern.test(dateStart)) {
    errors.push('dateStart is not a date');
  }
  const dateEnd = optionalString(record, 'dateEnd', errors);
  const timezone = optionalString(record, 'timezone', errors);
  const lineupRaw = optionalString(record, 'lineupRaw', errors);
  const timetableFestivalId = optionalString(record, 'timetableFestivalId', errors);
  const description = optionalString(record, 'description', errors);
  const organizer = optionalString(record, 'organizer', errors);
  let durationHours: number | undefined;
  if ('durationHours' in record && record.durationHours !== undefined) {
    durationHours = requireFinite(record, 'durationHours', errors);
  }
  let type: PartyType | undefined;
  if ('type' in record && record.type !== undefined) {
    const parsed = parseEnum(record.type, partyTypes, 'type');
    if (!parsed.ok) {
      errors.push(...parsed.errors);
    } else {
      type = parsed.value;
    }
  }
  const venue = parseVenue(record.venue, errors);
  const links = parseLinks(record.links, errors);
  if (!id || !title || !dateStart || !venue || !links) {
    return fail(errors);
  }
  const party: Party = { id, title, dateStart, venue, links };
  if (type) party.type = type;
  if (dateEnd) party.dateEnd = dateEnd;
  if (timezone) party.timezone = timezone;
  if (durationHours !== undefined) party.durationHours = durationHours;
  if (lineupRaw) party.lineupRaw = lineupRaw;
  if (timetableFestivalId) party.timetableFestivalId = timetableFestivalId;
  if (description) party.description = description;
  if (organizer) party.organizer = organizer;
  if ('stages' in record && record.stages !== undefined) {
    if (!Array.isArray(record.stages)) {
      errors.push('stages must be a list');
    } else {
      const stages: Stage[] = [];
      for (const stageInput of record.stages) {
        if (!isRecord(stageInput)) {
          errors.push('stage must be an object');
          continue;
        }
        rejectUnknown(stageInput, ['name', 'genres', 'artists'], errors);
        const name = requireString(stageInput, 'name', errors);
        const genres = stringList(stageInput.genres, 'genres', errors) ?? [];
        const artists: StageArtist[] = [];
        if (!Array.isArray(stageInput.artists)) {
          errors.push('artists must be a list');
        } else {
          for (const artistInput of stageInput.artists) {
            const artist = parseStageArtist(artistInput, errors);
            if (artist) artists.push(artist);
          }
        }
        if (name) stages.push({ name, genres, artists });
      }
      party.stages = stages;
    }
  }
  if ('cardArtists' in record && record.cardArtists !== undefined) {
    const cardArtists = stringList(record.cardArtists, 'cardArtists', errors);
    if (cardArtists) party.cardArtists = cardArtists;
  }
  if ('partnerIds' in record && record.partnerIds !== undefined) {
    const partnerIds = stringList(record.partnerIds, 'partnerIds', errors);
    if (partnerIds) party.partnerIds = partnerIds;
  }
  if ('offers' in record && record.offers !== undefined) {
    if (!Array.isArray(record.offers)) {
      errors.push('offers must be a list');
    } else {
      const offers: PartyOffer[] = [];
      for (const offerInput of record.offers) {
        if (!isRecord(offerInput)) {
          errors.push('offer must be an object');
          continue;
        }
        rejectUnknown(offerInput, ['name', 'amount', 'currency', 'capacity'], errors);
        const name = requireString(offerInput, 'name', errors);
        const amount = requireFinite(offerInput, 'amount', errors);
        const currency = optionalString(offerInput, 'currency', errors);
        let capacity: number | undefined;
        if ('capacity' in offerInput && offerInput.capacity !== undefined) {
          if (typeof offerInput.capacity !== 'number' || !Number.isInteger(offerInput.capacity) || offerInput.capacity < 1 || offerInput.capacity > 100000) {
            errors.push('capacity is not valid');
          } else {
            capacity = offerInput.capacity;
          }
        }
        if (name && amount !== undefined) {
          const offer: PartyOffer = currency ? { name, amount, currency } : { name, amount };
          if (capacity !== undefined) {
            offer.capacity = capacity;
          }
          offers.push(offer);
        }
      }
      party.offers = offers;
    }
  }
  return finish(errors, party);
}

export function parseArtist(input: unknown): ParseResult<Artist> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'name', 'country', 'isoCountry', 'countryFlag', 'genres', 'agencies', 'labels', 'stage'], errors);
  const id = requireString(read.value, 'id', errors);
  const rest = { ...read.value };
  delete rest.id;
  const artist = parseStageArtist(rest, errors);
  if (!id || !artist) {
    return fail(errors);
  }
  return finish(errors, { ...artist, id });
}

export function parseVenueRecord(input: unknown): ParseResult<Venue> {
  const errors: string[] = [];
  const venue = parseVenue(input, errors);
  if (!venue) {
    return fail(errors);
  }
  return finish(errors, venue);
}

export function parsePartner(input: unknown): ParseResult<Partner> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'name', 'city', 'handle', 'instagram'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const name = requireString(read.value, 'name', errors);
  const city = requireString(read.value, 'city', errors);
  const handle = requireString(read.value, 'handle', errors);
  const instagram = requireString(read.value, 'instagram', errors);
  if (!id || !name || !city || !handle || !instagram) {
    return fail(errors);
  }
  return okPartner({ id, name, city, handle, instagram }, errors);
}

function okPartner(value: Partner, errors: string[]): ParseResult<Partner> {
  return finish(errors, value);
}

export function parseAffiliation(input: unknown): ParseResult<Affiliation> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'name'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const name = requireString(read.value, 'name', errors);
  if (!id || !name) {
    return fail(errors);
  }
  return finish(errors, { id, name });
}

export function parseSocialLink(input: unknown): ParseResult<SocialLink> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'platform', 'label', 'handle', 'url'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const platform = requireString(read.value, 'platform', errors);
  const label = requireString(read.value, 'label', errors);
  const handle = requireString(read.value, 'handle', errors);
  const url = requireString(read.value, 'url', errors);
  if (!id || !platform || !label || !handle || !url) {
    return fail(errors);
  }
  return finish(errors, { id, platform, label, handle, url });
}

export function parseCalendarEntry(input: unknown, refs: SchemaRefs = {}): ParseResult<CalendarEntry> {
  const read = readRecord(input);
  if (!read.ok) {
    return read;
  }
  const errors: string[] = [];
  rejectUnknown(read.value, ['id', 'artistId', 'partyId'], errors);
  rejectSensitive(read.value, errors);
  const id = requireString(read.value, 'id', errors);
  const artistId = requireString(read.value, 'artistId', errors);
  const partyId = requireString(read.value, 'partyId', errors);
  if (artistId) requireRef(refs.artistIds, artistId, 'artistId', errors);
  if (partyId) requireRef(refs.partyIds, partyId, 'partyId', errors);
  if (!id || !artistId || !partyId) {
    return fail(errors);
  }
  return finish(errors, { id, artistId, partyId });
}
