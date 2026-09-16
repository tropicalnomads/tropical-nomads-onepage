// Generates the file-based events "backend" from the goabase JSON API.
// Outputs (written only when the payload actually changed; generatedAt is ignored
// for the comparison so a no-op run does not rewrite venues/partners/etc.):
//   public/data/events.json    (versioned envelope of EventRecord[])
//   public/data/artists.json   (deduped artist catalog, incl. agencies/labels)
//   public/data/venues.json    (deduped venue catalog)
//   public/data/agencies.json  (booking agencies catalog)
//   public/data/labels.json    (record labels catalog)
//   public/events/banners/<id>.<ext>  (downloaded flyer per event)
//
// Agency/label data is NOT provided by goabase. It is curated by hand in
// scripts/data/{agencies,labels,artist-affiliations}.json and merged in here.
//
// Run: pnpm events

import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_VERSION = 1;
const API_BASE = 'https://www.goabase.net/api/party/json';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(projectRoot, 'public/data');
const bannersDir = resolve(projectRoot, 'public/events/banners');
const partnersDir = resolve(projectRoot, 'public/partners');
const curatedDir = resolve(projectRoot, 'scripts/data');

// Authoritative event set (from the goabase member "added events" page),
// ordered by curation. Eventbrite overrides where ticket sales exist.
const EVENT_SOURCES = [
  {
    id: 118148,
    timetableFestivalId: 'tropical_groove_dublin_technology_2026',
    partnerIds: ['psy-groove'],
    eventbrite: 'https://technology-aram.eventbrite.ie/',
    instagram: [
      'https://www.instagram.com/tropicalnomads.events/',
      'https://www.instagram.com/psy.groove/',
    ],
  },
  {
    id: 118006,
    timetableFestivalId: 'tropical_nomads_berlin_2026',
    partnerIds: ['forest-shankara'],
    eventbrite: 'https://tropical-nomads-berlin.eventbrite.ie/',
    instagram: [
      'https://www.instagram.com/tropicalnomads.events/',
      'https://www.instagram.com/forest.untd/',
    ],
  },
  {
    id: 118153,
    eventbrite: 'https://tropical-nomads-athens-showcase.eventbrite.ie/',
    instagram: ['https://www.instagram.com/tropicalnomads.events/'],
  },
  {
    id: 117712,
    timetableFestivalId: 'tropical_nomads_2026',
    eventbrite: 'https://avan7amsterdam.eventbrite.ie',
  },
  {
    id: 117713,
    timetableFestivalId: 'tropical_groove_2026',
    eventbrite: 'https://avan7dublin.eventbrite.ie',
  },
  {
    id: 117914,
    timetableFestivalId: 'tropical_groove_dublin_2026',
    eventbrite:
      'https://www.eventbrite.ie/e/tropical-groove-presents-bocara-sabedoria-tickets-1993324939553',
    instagramPost: 'https://www.instagram.com/p/DcO8aCRNM8O/',
  },
  {
    id: 116643,
    timetableFestivalId: 'bom_shanka_london_2026',
    tickets:
      'https://www.skiddle.com/whats-on/London/Bar-A-Bar/Universe--Tropical-Nomads-Bom-Shanka-Label-night/41911407/',
    instagramPost: 'https://www.instagram.com/p/DcRfogkspVc/',
  },
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
  IN: '\u{1F1EE}\u{1F1F3}',
  GR: '\u{1F1EC}\u{1F1F7}',
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
const EMOJI_GLOBAL =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]/gu;
// Leading timecode / time-range prefix, e.g. "00:00 - ", "18:00 → 19:00 - ".
const TIME_PREFIX_REGEX =
  /^\s*\d{1,2}:\d{2}\s*(?:[–\-—→]\s*\d{1,2}:\d{2}\s*)?[–\-—→]\s*/u;
const DASH_SPLIT_REGEX = /\s+[–\-—]\s+/u;

// Genre vocabulary used to tell musical genres apart from artist names, crew
// affiliations and venue/label tags.
const GENRE_TOKENS = new Set([
  'psytrance',
  'progressive psytrance',
  'progressive',
  'prog',
  'prog tech',
  'fullon',
  'full-on',
  'full on',
  'fullon night',
  'full-on night',
  'night',
  'twilight',
  'forest',
  'dark',
  'hitech',
  'hi-tech',
  'hi tech',
  'psycore',
  'techno',
  'hard techno',
  'tech house',
  'minimal',
  'minimal deep tech',
  'deep tech',
  'house',
  'afro house',
  'underground house',
  'psytech',
  'psy-tech',
  'psytechno',
  'dub',
  'raw',
  'peak time',
  'acid',
]);

// Canonical display form for genres so casing/spelling variants merge.
const GENRE_CANON = new Map([
  ['psytrance', 'Psytrance'],
  ['progressive psytrance', 'Progressive Psytrance'],
  ['progressive', 'Progressive'],
  ['prog', 'Prog'],
  ['prog tech', 'Prog Tech'],
  ['fullon', 'Full-On'],
  ['full-on', 'Full-On'],
  ['full on', 'Full-On'],
  ['fullon night', 'Full-On Night'],
  ['full-on night', 'Full-On Night'],
  ['night', 'Night'],
  ['twilight', 'Twilight'],
  ['forest', 'Forest'],
  ['dark', 'Dark'],
  ['hitech', 'Hitech'],
  ['hi-tech', 'Hitech'],
  ['hi tech', 'Hitech'],
  ['psycore', 'Psycore'],
  ['techno', 'Techno'],
  ['hard techno', 'Hard Techno'],
  ['tech house', 'Tech House'],
  ['minimal', 'Minimal'],
  ['minimal deep tech', 'Minimal Deep Tech'],
  ['deep tech', 'Deep Tech'],
  ['house', 'House'],
  ['afro house', 'Afro House'],
  ['underground house', 'Underground House'],
  ['psytech', 'Psytech'],
  ['psy-tech', 'Psytech'],
  ['psytechno', 'Psytechno'],
  ['dub', 'Dub'],
  ['raw', 'Raw'],
  ['peak time', 'Peak Time'],
  ['acid', 'Acid'],
]);

function canonicalizeGenre(token) {
  return GENRE_CANON.get(token.toLowerCase()) ?? token.trim();
}

const ARTIST_STOPWORDS = new Set([
  'end',
  'fim',
  'venue',
  'terrace',
  'soundhouse',
  'line up',
  'lineup',
  'free',
  'paid',
  'tba',
]);

const ARTIST_BLOCKLIST = [
  'presents',
  'entry',
  'festival',
  'line up',
  'lineup',
  'horário',
  'horario',
  'join us',
  'let’s',
  "let's",
  'edition',
  'features',
  'arrives',
  'dedicated',
  'http',
  'eatyard',
  'racket space',
  'bernard shaw',
  'sound house',
  'label night',
  'music label',
  'this is',
  'coming properly',
];

// Lines that contain no letters/numbers are decorative separators (e.g. "═════").
function isDecorative(value) {
  return !/[\p{L}\p{N}]/u.test(value);
}

function isoToFlag(iso) {
  if (!iso || !/^[A-Z]{2}$/.test(iso)) return undefined;
  const base = 0x1f1e6;
  return String.fromCodePoint(base + iso.charCodeAt(0) - 65, base + iso.charCodeAt(1) - 65);
}

function stripEmoji(value) {
  return value.replace(EMOJI_GLOBAL, ' ').replace(/\s+/g, ' ').trim();
}

// Returns the genre tokens if every slash/comma-separated token is a known
// genre, otherwise null (so labels/crews are not mistaken for genres).
function asGenres(text) {
  const tokens = text
    .split(/[\/,]/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) return null;
  if (tokens.every((token) => GENRE_TOKENS.has(token.toLowerCase()))) {
    return tokens.map(canonicalizeGenre);
  }
  return null;
}

// Canonical artist display name: normalize curly apostrophes and drop a
// trailing " LIVE" marker so "Valar" and "Valar LIVE" merge.
function normalizeArtistName(name) {
  return name
    .replace(/[’‘`]/g, "'")
    .replace(/\s+live$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function artistKey(name) {
  return normalizeArtistName(name).toLowerCase().replace(/'/g, '');
}

function isLikelyArtist(name) {
  if (!name || name.length < 2) return false;
  const lower = name.toLowerCase();
  if (ARTIST_STOPWORDS.has(lower)) return false;
  if (/\d{1,2}:\d{2}/.test(name)) return false;
  if (/\d\s*(?:am|pm)\b/i.test(name)) return false;
  if (name.split(/\s+/).length > 5) return false;
  if (ARTIST_BLOCKLIST.some((blocked) => lower.includes(blocked))) return false;
  return true;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Turns a single line-up line into zero or more clean artist records.
// Strips timecodes, pulls out genres (parentheses or trailing dash segment)
// and country, drops crew/label tags, and splits "A b2b B" into two artists.
function parseArtistEntries(line) {
  const flagMatch = line.match(FLAG_REGEX);
  let isoCountry = flagToIso(flagMatch ? flagMatch[0] : undefined);
  const genres = [];

  let working = line.replace(TIME_PREFIX_REGEX, '');

  working = working.replace(/\(([^)]*)\)/g, (_full, inner) => {
    const trimmed = inner.trim();
    if (/^[A-Z]{2,3}$/.test(trimmed)) {
      isoCountry = isoCountry ?? trimmed;
      return ' ';
    }
    const genreTokens = asGenres(trimmed);
    if (genreTokens) {
      genres.push(...genreTokens);
    }
    return ' ';
  });

  working = stripEmoji(working);

  const dashParts = working.split(DASH_SPLIT_REGEX);
  if (dashParts.length > 1) {
    const tail = dashParts[dashParts.length - 1];
    const tailGenres = asGenres(tail);
    if (tailGenres) {
      genres.push(...tailGenres);
      working = dashParts.slice(0, -1).join(' - ').trim();
    }
  }

  const iso = isoCountry && /^[A-Z]{2}$/.test(isoCountry) ? isoCountry : undefined;
  const flag = iso ? isoToFlag(iso) : flagMatch ? flagMatch[0] : undefined;
  const cleanGenres = [...new Set(genres.map((genre) => genre.trim()).filter(Boolean))];

  return working
    .split(/\s+b2b\s+/i)
    .map((name) => normalizeArtistName(name.replace(/^[\s"'*]+|[\s"'*]+$/g, '')))
    .filter((name) => isLikelyArtist(name))
    .map((name) => ({
      name,
      ...(iso ? { isoCountry: iso } : {}),
      ...(flag ? { countryFlag: flag } : {}),
      ...(cleanGenres.length ? { genres: cleanGenres } : {}),
    }));
}

// Parses goabase free-text line-up into structured stages + artists.
// Stage headers are lines without a country flag that contain "STAGE"/"FLOOR".
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

  const pushArtist = (stage, artist) => {
    const existing = stage.artists.find(
      (item) => artistKey(item.name) === artistKey(artist.name),
    );
    if (!existing) {
      stage.artists.push({ ...artist, stage: stage.name });
      return;
    }
    if (artist.genres) {
      existing.genres = [...new Set([...(existing.genres ?? []), ...artist.genres])];
    }
    existing.isoCountry = existing.isoCountry ?? artist.isoCountry;
    existing.countryFlag = existing.countryFlag ?? artist.countryFlag;
  };

  for (const line of lines) {
    const hasFlag = FLAG_REGEX.test(line);
    const looksLikeStage = !hasFlag && /(stage|floor|arena|palco)/i.test(line);

    if (looksLikeStage) {
      const genreMatch = line.match(/\(([^)]*)\)/);
      const genres = genreMatch
        ? genreMatch[1]
            .split(/[,/]/)
            .map((genre) => genre.trim())
            .filter(Boolean)
            .map(canonicalizeGenre)
        : [];
      const name = stripEmoji(line.replace(/\(([^)]*)\)/, '')) || 'Stage';
      current = { name, genres, artists: [] };
      stages.push(current);
      continue;
    }

    const stage = ensureDefaultStage();
    for (const artist of parseArtistEntries(line)) {
      pushArtist(stage, artist);
    }
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

// Downloads a partner's Instagram avatar via unavatar.io and stores it locally.
// Best-effort: returns the local path on success, undefined on failure.
async function downloadPartnerAvatar(igUsername, id) {
  const url = `https://unavatar.io/instagram/${igUsername}?fallback=false`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'tropical-nomads-page/1.0' },
    });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error('empty image');
    }
    const fileName = `${id}.jpg`;
    await writeFile(resolve(partnersDir, fileName), Buffer.from(arrayBuffer));
    return `/partners/${fileName}`;
  } catch (error) {
    console.warn(`Partner avatar download failed for ${igUsername}: ${error.message}`);
    return undefined;
  }
}

async function buildPartners() {
  const curated = await readCuratedJson('partners.json', []);
  const partners = [];
  for (const partner of curated) {
    // A curated local logo (committed under public/partners/) always wins;
    // otherwise fall back to a best-effort unavatar download.
    const logo = partner.logo ?? (await downloadPartnerAvatar(partner.igUsername, partner.id));
    partners.push({
      id: partner.id,
      name: partner.name,
      city: partner.city,
      handle: partner.handle,
      instagram: partner.instagram,
      ...(Array.isArray(partner.instagrams) && partner.instagrams.length > 0
        ? { instagrams: partner.instagrams }
        : {}),
      ...(logo ? { logo } : {}),
      ...(partner.logoFit ? { logoFit: partner.logoFit } : {}),
    });
  }
  return partners;
}

function pickMedia(mediaOverride) {
  if (!mediaOverride) {
    return undefined;
  }
  const kinds = ['photos', 'videos', 'sets'];
  const media = {};
  for (const kind of kinds) {
    const links = (mediaOverride[kind] ?? []).filter((item) => item && item.url);
    if (links.length > 0) {
      media[kind] = links.map((item) => ({
        url: item.url,
        ...(item.label ? { label: item.label } : {}),
      }));
    }
  }
  return Object.keys(media).length > 0 ? media : undefined;
}

function normalizeEvent(party, override, venueOverride, lineupOverride, mediaOverride) {
  const hasLineupRaw = Boolean(lineupOverride) && Object.prototype.hasOwnProperty.call(lineupOverride, 'lineupRaw');
  const textLineUp = hasLineupRaw ? lineupOverride.lineupRaw : party.textLineUp;
  const stages = parseLineup(textLineUp);

  // Curated lineup corrections: rename specific artists across all stages.
  const renameMap = lineupOverride?.rename;
  if (renameMap) {
    for (const stage of stages) {
      for (const artist of stage.artists) {
        if (Object.prototype.hasOwnProperty.call(renameMap, artist.name)) {
          artist.name = renameMap[artist.name];
        }
      }
    }
  }
  const geo =
    party.geoLat || party.geoLon ? { geo: { lat: party.geoLat, lon: party.geoLon } } : {};
  const venue = venueOverride
    ? {
        id: venueOverride.id,
        ...(venueOverride.name ? { name: venueOverride.name } : {}),
        city: venueOverride.city ?? party.nameTown,
        country: venueOverride.country ?? party.nameCountry,
        isoCountry: venueOverride.isoCountry ?? party.isoCountry,
        ...(venueOverride.address ? { address: venueOverride.address } : {}),
        ...geo,
        ...(venueOverride.mapUrl ? { mapUrl: venueOverride.mapUrl } : {}),
      }
    : {
        id: slugify(`${party.nameTown}-${party.nameCountry}`),
        ...((party.textLocation || '').trim() ? { name: party.textLocation.trim() } : {}),
        city: party.nameTown,
        country: party.nameCountry,
        isoCountry: party.isoCountry,
        ...geo,
      };

  const description =
    lineupOverride && Object.prototype.hasOwnProperty.call(lineupOverride, 'description')
      ? lineupOverride.description
      : party.textMore;

  return {
    id: String(party.id),
    title: lineupOverride?.title ?? party.nameParty,
    ...(override?.partnerIds?.length ? { partnerIds: override.partnerIds } : {}),
    ...(override?.timetableFestivalId ? { timetableFestivalId: override.timetableFestivalId } : {}),
    type: party.nameType,
    dateStart: party.dateStart,
    ...(party.dateEnd ? { dateEnd: party.dateEnd } : {}),
    ...(party.timezone ? { timezone: party.timezone } : {}),
    ...(computeDurationHours(party.dateStart, party.dateEnd)
      ? { durationHours: computeDurationHours(party.dateStart, party.dateEnd) }
      : {}),
    venue,
    ...(textLineUp ? { lineupRaw: textLineUp } : {}),
    stages,
    ...(lineupOverride?.cardArtists?.length ? { cardArtists: lineupOverride.cardArtists } : {}),
    ...(pickMedia(mediaOverride) ? { media: pickMedia(mediaOverride) } : {}),
    ...(description ? { description } : {}),
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
      ...(override?.tickets ? { tickets: override.tickets } : {}),
      ...(override?.instagram?.length
        ? { instagram: override.instagram }
        : parseInstagramLinks(party.urlOrganizer).length
          ? { instagram: parseInstagramLinks(party.urlOrganizer) }
          : {}),
      ...(override?.instagramPost ? { instagramPost: override.instagramPost } : {}),
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

function isAllCaps(value) {
  return value === value.toUpperCase() && /[A-Z]/.test(value);
}

async function readCuratedJson(fileName, fallback) {
  try {
    return JSON.parse(await readFile(resolve(curatedDir, fileName), 'utf8'));
  } catch {
    return fallback;
  }
}

// Loads curated agency/label catalogs and the per-artist affiliation map.
// Returns resolver helpers keyed by artistKey, plus the catalog arrays to emit.
async function loadAffiliations() {
  const agencies = await readCuratedJson('agencies.json', []);
  const labels = await readCuratedJson('labels.json', []);
  const rawAffiliations = await readCuratedJson('artist-affiliations.json', {});

  const agencyById = new Map(agencies.map((agency) => [agency.id, agency]));
  const labelById = new Map(labels.map((label) => [label.id, label]));

  const byArtist = new Map();
  for (const [artistName, value] of Object.entries(rawAffiliations)) {
    const agencyNames = (value.agencies ?? []).map((id) => {
      const agency = agencyById.get(id);
      if (!agency) {
        console.warn(`Unknown agency id "${id}" for artist "${artistName}"`);
        return null;
      }
      return agency.name;
    });
    const labelNames = (value.labels ?? []).map((id) => {
      const label = labelById.get(id);
      if (!label) {
        console.warn(`Unknown label id "${id}" for artist "${artistName}"`);
        return null;
      }
      return label.name;
    });
    byArtist.set(artistKey(artistName), {
      agencies: agencyNames.filter(Boolean),
      labels: labelNames.filter(Boolean),
    });
  }

  return { agencies, labels, byArtist };
}

function buildArtistCatalog(events, affiliations = { byArtist: new Map() }) {
  const byKey = new Map();
  for (const event of events) {
    for (const stage of event.stages) {
      for (const artist of stage.artists) {
        const key = artistKey(artist.name);
        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, {
            name: artist.name,
            isoCountry: artist.isoCountry,
            countryFlag: artist.countryFlag,
            genres: new Set(artist.genres ?? []),
          });
          continue;
        }
        if (isAllCaps(existing.name) && !isAllCaps(artist.name)) {
          existing.name = artist.name;
        }
        existing.isoCountry = existing.isoCountry ?? artist.isoCountry;
        existing.countryFlag = existing.countryFlag ?? artist.countryFlag;
        for (const genre of artist.genres ?? []) {
          existing.genres.add(genre);
        }
      }
    }
  }
  return [...byKey.entries()]
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .map(([key, artist]) => {
      const affiliation = affiliations.byArtist.get(key);
      return {
        name: artist.name,
        ...(artist.isoCountry ? { isoCountry: artist.isoCountry } : {}),
        ...(artist.countryFlag ? { countryFlag: artist.countryFlag } : {}),
        ...(artist.genres.size ? { genres: [...artist.genres].sort() } : {}),
        ...(affiliation?.agencies.length ? { agencies: affiliation.agencies } : {}),
        ...(affiliation?.labels.length ? { labels: affiliation.labels } : {}),
      };
    });
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

// One-time importer: pulls raw events from the goabase API and normalizes them.
// Only runs when explicitly requested via --refresh / GOABASE_REFRESH=1, because
// public/data/events.json is now the curated source of truth and must not be
// clobbered (titles, lineups, media etc. are edited by hand).
async function fetchEventsFromGoabase(sources = EVENT_SOURCES) {
  const curatedVenues = await readCuratedJson('venues.json', []);
  const eventVenueMap = await readCuratedJson('event-venues.json', {});
  const venueById = new Map(curatedVenues.map((venue) => [venue.id, venue]));
  const lineupOverrides = await readCuratedJson('event-lineups.json', {});
  const mediaOverrides = await readCuratedJson('event-media.json', {});

  const events = [];

  for (const sourceItem of sources) {
    const payload = await fetchJson(`${API_BASE}/${sourceItem.id}`);
    const party = payload.party ?? payload;
    if (!party || !party.id) {
      console.warn(`Skipping ${sourceItem.id}: no party data returned`);
      continue;
    }

    const venueId = eventVenueMap[String(sourceItem.id)];
    const venueOverride = venueId ? venueById.get(venueId) : undefined;
    if (venueId && !venueOverride) {
      console.warn(`Unknown venue id "${venueId}" for event ${sourceItem.id}`);
    }

    const lineupOverride = lineupOverrides[String(sourceItem.id)];
    const mediaOverride = mediaOverrides[String(sourceItem.id)];
    const event = normalizeEvent(party, sourceItem, venueOverride, lineupOverride, mediaOverride);

    const bannerSource =
      party.urlImageLarge || party.urlImageFull || party.urlImageMedium || party.urlImageSmall;
    if (lineupOverride?.bannerKeepLocal) {
      const localPath = `/events/banners/${party.id}.${pickImageExtension(event.images?.bannerLocal ?? bannerSource ?? '.jpg')}`;
      event.images = {
        small: localPath,
        medium: localPath,
        large: localPath,
        full: localPath,
        bannerLocal: localPath,
      };
    } else if (bannerSource) {
      try {
        event.images.bannerLocal = await downloadBanner(bannerSource, party.id);
      } catch (error) {
        console.warn(`Banner download failed for ${party.id}: ${error.message}`);
      }
    }

    events.push(event);
    console.log(`Fetched ${party.id} - ${party.nameParty}`);
  }

  return events;
}

async function loadExistingEvents() {
  try {
    const raw = JSON.parse(await readFile(resolve(dataDir, 'events.json'), 'utf8'));
    return Array.isArray(raw.events) ? raw.events : [];
  } catch {
    return [];
  }
}

function omitGeneratedAt(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const { generatedAt: _generatedAt, ...rest } = value;
  return rest;
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function readJsonFile(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

async function writeJsonIfChanged(path, nextFile) {
  const previous = await readJsonFile(path);
  if (previous && stableSerialize(omitGeneratedAt(previous)) === stableSerialize(omitGeneratedAt(nextFile))) {
    return false;
  }
  await writeFile(path, `${JSON.stringify(nextFile, null, 2)}\n`);
  return true;
}

async function main() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(bannersDir, { recursive: true });
  await mkdir(partnersDir, { recursive: true });

  const refresh = process.argv.includes('--refresh') || process.env.GOABASE_REFRESH === '1';
  const mergeArg = process.argv.find((arg) => arg.startsWith('--merge='));
  const mergeIds = mergeArg
    ? mergeArg
        .slice('--merge='.length)
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value))
    : [];

  let events;
  let wroteEvents = false;
  if (mergeIds.length > 0) {
    const existing = await loadExistingEvents();
    const byId = new Map(existing.map((event) => [String(event.id), event]));
    const sources = mergeIds.map((id) => EVENT_SOURCES.find((item) => item.id === id) ?? { id });
    console.log(`Merging ${sources.length} event(s) from goabase into events.json...`);
    const fetched = await fetchEventsFromGoabase(sources);
    for (const event of fetched) {
      const previous = byId.get(event.id);
      if (previous) {
        event.partnerIds = event.partnerIds ?? previous.partnerIds;
        event.timetableFestivalId = event.timetableFestivalId ?? previous.timetableFestivalId;
        if (previous.links?.instagramPost && !event.links.instagramPost) {
          event.links.instagramPost = previous.links.instagramPost;
        }
        if (previous.links?.instagram && !event.links.instagram) {
          event.links.instagram = previous.links.instagram;
        }
      }
      byId.set(event.id, event);
    }
    events = EVENT_SOURCES.map((item) => byId.get(String(item.id))).filter(Boolean);
    for (const event of byId.values()) {
      if (String(event.id).startsWith('tn-placeholder-')) continue;
      if (!events.some((item) => item.id === event.id)) events.push(event);
    }
    wroteEvents = true;
  } else if (refresh) {
    console.log('Refreshing events from goabase (one-time fetch)...');
    events = await fetchEventsFromGoabase();
    wroteEvents = true;
  } else {
    events = await loadExistingEvents();
    console.log(
      `Using ${events.length} curated events from events.json (goabase fetch skipped; pass --refresh to re-import).`,
    );
  }

  const generatedAt = new Date().toISOString();

  const affiliations = await loadAffiliations();
  const artists = buildArtistCatalog(events, affiliations);
  const venues = buildVenueCatalog(events);
  const partners = await buildPartners();

  const catalogWrites = [];
  if (wroteEvents) {
    catalogWrites.push([
      'events.json',
      {
        schemaVersion: SCHEMA_VERSION,
        generatedAt,
        source: { provider: 'goabase', endpoint: API_BASE },
        count: events.length,
        events,
      },
    ]);
  }
  catalogWrites.push(
    ['artists.json', { schemaVersion: SCHEMA_VERSION, generatedAt, count: artists.length, artists }],
    ['venues.json', { schemaVersion: SCHEMA_VERSION, generatedAt, count: venues.length, venues }],
    [
      'agencies.json',
      {
        schemaVersion: SCHEMA_VERSION,
        generatedAt,
        count: affiliations.agencies.length,
        agencies: affiliations.agencies,
      },
    ],
    [
      'labels.json',
      {
        schemaVersion: SCHEMA_VERSION,
        generatedAt,
        count: affiliations.labels.length,
        labels: affiliations.labels,
      },
    ],
    ['partners.json', { schemaVersion: SCHEMA_VERSION, generatedAt, count: partners.length, partners }],
  );

  const written = [];
  const skipped = [];
  for (const [fileName, payload] of catalogWrites) {
    const changed = await writeJsonIfChanged(resolve(dataDir, fileName), payload);
    if (changed) {
      written.push(fileName);
    } else {
      skipped.push(fileName);
    }
  }

  if (written.length > 0) {
    console.log(`\nUpdated ${written.join(', ')}.`);
  } else {
    console.log('\nNo catalog files needed updates.');
  }
  if (skipped.length > 0) {
    console.log(`Left unchanged: ${skipped.join(', ')}.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
