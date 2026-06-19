// Generates the file-based events "backend" from the goabase JSON API.
// Outputs:
//   public/data/events.json   (versioned envelope of EventRecord[])
//   public/data/artists.json  (deduped artist catalog)
//   public/data/venues.json   (deduped venue catalog)
//   public/events/banners/<id>.<ext>  (downloaded flyer per event)
//
// Run: pnpm events

import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_VERSION = 1;
const API_BASE = 'https://www.goabase.net/api/party/json';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(projectRoot, 'public/data');
const bannersDir = resolve(projectRoot, 'public/events/banners');

// Authoritative event set (from the goabase member "added events" page),
// ordered by curation. Eventbrite overrides where ticket sales exist.
const EVENT_SOURCES = [
  { id: 117712, eventbrite: 'https://avan7amsterdam.eventbrite.ie' },
  { id: 117713, eventbrite: 'https://avan7dublin.eventbrite.ie' },
  { id: 116643 },
  { id: 117120 },
  { id: 117152 },
  { id: 117257 },
  { id: 116906 },
  { id: 116039 },
  { id: 115995 },
  { id: 115553 },
];

const KNOWN_FLAGS = {
  BR: '\u{1F1E7}\u{1F1F7}',
  NL: '\u{1F1F3}\u{1F1F1}',
  IE: '\u{1F1EE}\u{1F1EA}',
  DE: '\u{1F1E9}\u{1F1EA}',
  GB: '\u{1F1EC}\u{1F1E7}',
  UK: '\u{1F1EC}\u{1F1E7}',
  PT: '\u{1F1F5}\u{1F1F9}',
  ES: '\u{1F1EA}\u{1F1F8}',
};

function flagToIso(flag) {
  if (!flag) return undefined;
  const codePoints = [...flag];
  if (codePoints.length < 2) return undefined;
  const base = 0x1f1e6;
  const a = codePoints[0].codePointAt(0);
  const b = codePoints[1].codePointAt(0);
  if (a === undefined || b === undefined) return undefined;
  if (a < base || b < base) return undefined;
  const iso = String.fromCharCode(65 + (a - base)) + String.fromCharCode(65 + (b - base));
  return /^[A-Z]{2}$/.test(iso) ? iso : undefined;
}

const FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}/u;
const LEADING_EMOJI_REGEX =
  /^[\s\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\uFE0F\u200D]+/u;

// Lines that contain no letters/numbers are decorative separators (e.g. "═════").
function isDecorative(value) {
  return !/[\p{L}\p{N}]/u.test(value);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Parses goabase free-text line-up into structured stages + artists.
// Stage headers are lines without a country flag that contain "STAGE"/"FLOOR"
// or are wrapped emphasis; artist lines usually start with a country flag.
function parseLineup(textLineUp) {
  if (!textLineUp || !textLineUp.trim()) return [];

  const lines = textLineUp
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !isDecorative(line));

  const stages = [];
  let current = null;

  const ensureDefaultStage = () => {
    if (!current) {
      current = { name: 'Line-up', genres: [], artists: [] };
      stages.push(current);
    }
    return current;
  };

  for (const line of lines) {
    const hasFlag = FLAG_REGEX.test(line);
    const looksLikeStage =
      !hasFlag && /(stage|floor|arena|area|palco)/i.test(line);

    if (looksLikeStage) {
      const genreMatch = line.match(/\(([^)]*)\)/);
      const genres = genreMatch
        ? genreMatch[1]
            .split(/[,/]/)
            .map((g) => g.trim())
            .filter(Boolean)
        : [];
      const name = line
        .replace(/\(([^)]*)\)/, '')
        .replace(LEADING_EMOJI_REGEX, '')
        .trim();
      current = { name: name || 'Stage', genres, artists: [] };
      stages.push(current);
      continue;
    }

    const stage = ensureDefaultStage();
    const flagMatch = line.match(FLAG_REGEX);
    const countryFlag = flagMatch ? flagMatch[0] : undefined;
    const name = line.replace(LEADING_EMOJI_REGEX, '').trim();
    if (!name) continue;

    const isoCountry = flagToIso(countryFlag);
    stage.artists.push({
      name,
      countryFlag,
      ...(isoCountry ? { isoCountry } : {}),
      stage: stage.name,
    });
  }

  return stages.filter((stage) => stage.artists.length > 0 || stage.genres.length > 0);
}

function parseInstagramLinks(urlOrganizer) {
  if (!urlOrganizer) return [];
  const matches = urlOrganizer.match(/https?:\/\/[^\s]+/g) ?? [];
  return matches.filter((url) => /instagram\.com/i.test(url));
}

function computeDurationHours(dateStart, dateEnd) {
  if (!dateStart || !dateEnd) return undefined;
  const start = Date.parse(dateStart);
  const end = Date.parse(dateEnd);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return undefined;
  return Math.round((end - start) / (1000 * 60 * 60));
}

function pickImageExtension(url) {
  const match = url.match(/\.(png|jpe?g|webp|gif)(?:\?|$)/i);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'tropical-nomads-page/1.0' },
  });
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.json();
}

async function downloadBanner(url, id) {
  const ext = pickImageExtension(url);
  const fileName = `${id}.${ext}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'tropical-nomads-page/1.0' },
  });
  if (!response.ok) {
    throw new Error(`Banner download failed ${response.status} for ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await writeFile(resolve(bannersDir, fileName), Buffer.from(arrayBuffer));
  return `/events/banners/${fileName}`;
}

function normalizeEvent(party, override) {
  const stages = parseLineup(party.textLineUp);
  const venueName = (party.textLocation || '').trim() || undefined;
  const venue = {
    id: slugify(`${party.nameTown}-${party.nameCountry}`),
    ...(venueName ? { name: venueName } : {}),
    city: party.nameTown,
    country: party.nameCountry,
    isoCountry: party.isoCountry,
    ...(party.geoLat || party.geoLon
      ? { geo: { lat: party.geoLat, lon: party.geoLon } }
      : {}),
  };

  return {
    id: String(party.id),
    title: party.nameParty,
    type: party.nameType,
    dateStart: party.dateStart,
    ...(party.dateEnd ? { dateEnd: party.dateEnd } : {}),
    ...(party.timezone ? { timezone: party.timezone } : {}),
    ...(computeDurationHours(party.dateStart, party.dateEnd)
      ? { durationHours: computeDurationHours(party.dateStart, party.dateEnd) }
      : {}),
    venue,
    ...(party.textLineUp ? { lineupRaw: party.textLineUp } : {}),
    stages,
    ...(party.textMore ? { description: party.textMore } : {}),
    ...(party.nameOrganizer ? { organizer: party.nameOrganizer } : {}),
    images: {
      ...(party.urlImageSmall ? { small: party.urlImageSmall } : {}),
      ...(party.urlImageMedium ? { medium: party.urlImageMedium } : {}),
      ...(party.urlImageLarge ? { large: party.urlImageLarge } : {}),
      ...(party.urlImageFull ? { full: party.urlImageFull } : {}),
    },
    links: {
      goabase: party.urlParty || party.urlPartyHtml,
      ...(override?.eventbrite ? { eventbrite: override.eventbrite } : {}),
      ...(parseInstagramLinks(party.urlOrganizer).length
        ? { instagram: parseInstagramLinks(party.urlOrganizer) }
        : {}),
    },
    source: {
      provider: 'goabase',
      id: party.id,
      url: party.urlParty || party.urlPartyHtml,
      ...(party.nameStatus ? { status: party.nameStatus } : {}),
      ...(party.dateCreated ? { dateCreated: party.dateCreated } : {}),
      ...(party.dateModified ? { dateModified: party.dateModified } : {}),
    },
  };
}

function buildArtistCatalog(events) {
  const byKey = new Map();
  for (const event of events) {
    for (const stage of event.stages) {
      for (const artist of stage.artists) {
        const key = artist.name.toLowerCase();
        if (!byKey.has(key)) {
          byKey.set(key, {
            name: artist.name,
            ...(artist.isoCountry ? { isoCountry: artist.isoCountry } : {}),
            ...(artist.countryFlag ? { countryFlag: artist.countryFlag } : {}),
          });
        }
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function buildVenueCatalog(events) {
  const byId = new Map();
  for (const event of events) {
    if (!byId.has(event.venue.id)) {
      byId.set(event.venue.id, event.venue);
    }
  }
  return [...byId.values()].sort((a, b) => a.city.localeCompare(b.city));
}

async function main() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(bannersDir, { recursive: true });

  const events = [];

  for (const sourceItem of EVENT_SOURCES) {
    const payload = await fetchJson(`${API_BASE}/${sourceItem.id}`);
    const party = payload.party ?? payload;
    if (!party || !party.id) {
      console.warn(`Skipping ${sourceItem.id}: no party data returned`);
      continue;
    }

    const event = normalizeEvent(party, sourceItem);

    const bannerSource =
      party.urlImageLarge || party.urlImageFull || party.urlImageMedium || party.urlImageSmall;
    if (bannerSource) {
      try {
        event.images.bannerLocal = await downloadBanner(bannerSource, party.id);
      } catch (error) {
        console.warn(`Banner download failed for ${party.id}: ${error.message}`);
      }
    }

    events.push(event);
    console.log(`Fetched ${party.id} - ${party.nameParty}`);
  }

  const generatedAt = new Date().toISOString();

  const eventsFile = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    source: { provider: 'goabase', endpoint: API_BASE },
    count: events.length,
    events,
  };

  const artists = buildArtistCatalog(events);
  const venues = buildVenueCatalog(events);

  await writeFile(resolve(dataDir, 'events.json'), `${JSON.stringify(eventsFile, null, 2)}\n`);
  await writeFile(
    resolve(dataDir, 'artists.json'),
    `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, generatedAt, count: artists.length, artists }, null, 2)}\n`,
  );
  await writeFile(
    resolve(dataDir, 'venues.json'),
    `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, generatedAt, count: venues.length, venues }, null, 2)}\n`,
  );

  console.log(`\nWrote ${events.length} events, ${artists.length} artists, ${venues.length} venues.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
