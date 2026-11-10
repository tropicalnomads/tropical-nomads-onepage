import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';
import { SHOP_PICKUP, SHOP_PRICE_EUR, SHOP_PRODUCTS } from '../apps/one-pager/src/lib/shop.ts';
import { offersForCatalogSeed } from './party-seed.mjs';
import { databaseSettings, sslConfig } from './settings.mjs';

const { Client } = pg;
const dataDirectory = join(dirname(fileURLToPath(import.meta.url)), '../apps/one-pager/public/data');

function readData(name) {
  return JSON.parse(readFileSync(join(dataDirectory, name), 'utf8'));
}

function text(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function json(value) {
  return value === undefined ? null : JSON.stringify(value);
}

function slug(name, used) {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const stem = base === '' ? 'artist' : base;
  let id = stem;
  let suffix = 2;
  while (used.has(id)) {
    id = `${stem}-${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}

async function putEnvelope(client, name, document) {
  await client.query(
    `insert into catalog_envelope (name, document) values ($1, $2::jsonb)
     on conflict (name) do update set document = excluded.document`,
    [name, JSON.stringify(document)],
  );
}

async function seedCatalog(client) {
  const eventsFile = readData('events.json');
  const artistsFile = readData('artists.json');
  const venuesFile = readData('venues.json');
  const partnersFile = readData('partners.json');
  const labelsFile = readData('labels.json');
  const agenciesFile = readData('agencies.json');
  const socialsFile = readData('socials.json');

  const existingParties = await client.query('select id, origin, publication, revisions, offers, offers_managed from party');
  const kept = new Map(existingParties.rows.map((row) => [row.id, row]));
  const catalogIds = eventsFile.events.map((event) => event.id);
  await client.query(`delete from party where origin = 'catalog' and not (id = any($1::text[]))`, [catalogIds]);

  await client.query('delete from artist');
  await client.query('delete from venue');
  await client.query('delete from partner');
  await client.query('delete from label');
  await client.query('delete from agency');
  await client.query('delete from social_link');

  let order = 0;
  for (const event of eventsFile.events) {
    const row = kept.get(event.id);
    if (row && row.origin === 'admin') {
      order += 1;
      continue;
    }
    const venue = event.venue && typeof event.venue === 'object' ? event.venue : {};
    const offers = offersForCatalogSeed(row?.offers_managed === true, row?.offers, event.offers);
    const document = { ...event, offers: offers ?? undefined };
    if (document.offers === undefined) {
      delete document.offers;
    }
    await client.query(
      `insert into party (
        id, title, type, date_start, date_end, timezone, duration_hours, venue_id, venue, lineup_raw,
        stages, card_artists, partner_ids, timetable_festival_id, media, description, organizer, images,
        links, source, offers, document, source_order, origin, publication, revisions, offers_managed
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10,
        $11::jsonb, $12::jsonb, $13, $14, $15::jsonb, $16, $17, $18::jsonb,
        $19::jsonb, $20::jsonb, $21::jsonb, $22::jsonb, $23, 'catalog', 'published', '[]'::jsonb, false
      )
      on conflict (id) do update set
        title = excluded.title,
        type = excluded.type,
        date_start = excluded.date_start,
        date_end = excluded.date_end,
        timezone = excluded.timezone,
        duration_hours = excluded.duration_hours,
        venue_id = excluded.venue_id,
        venue = excluded.venue,
        lineup_raw = excluded.lineup_raw,
        stages = excluded.stages,
        card_artists = excluded.card_artists,
        partner_ids = excluded.partner_ids,
        timetable_festival_id = excluded.timetable_festival_id,
        media = excluded.media,
        description = excluded.description,
        organizer = excluded.organizer,
        images = excluded.images,
        links = excluded.links,
        source = excluded.source,
        offers = excluded.offers,
        document = excluded.document,
        source_order = excluded.source_order,
        publication = party.publication,
        revisions = party.revisions,
        offers_managed = party.offers_managed`,
      [
        event.id,
        event.title,
        text(event.type),
        event.dateStart,
        text(event.dateEnd),
        text(event.timezone),
        typeof event.durationHours === 'number' ? event.durationHours : null,
        text(venue.id),
        json(event.venue),
        text(event.lineupRaw),
        json(event.stages),
        json(event.cardArtists),
        Array.isArray(event.partnerIds) ? event.partnerIds : [],
        text(event.timetableFestivalId),
        json(event.media),
        text(event.description),
        text(event.organizer),
        json(event.images),
        json(event.links),
        json(event.source),
        json(offers),
        JSON.stringify(document),
        order,
      ],
    );
    order += 1;
  }
  await putEnvelope(client, 'events', {
    schemaVersion: eventsFile.schemaVersion,
    generatedAt: eventsFile.generatedAt,
    source: eventsFile.source,
  });

  const artistIds = new Set();
  order = 0;
  for (const artist of artistsFile.artists) {
    const name = typeof artist.name === 'string' ? artist.name : '';
    await client.query(
      `insert into artist (id, name, country, iso_country, country_flag, genres, agencies, labels, stage, document, source_order)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10::jsonb, $11)`,
      [
        slug(name, artistIds),
        name,
        text(artist.country),
        text(artist.isoCountry),
        text(artist.countryFlag),
        json(artist.genres),
        json(artist.agencies),
        json(artist.labels),
        text(artist.stage),
        JSON.stringify(artist),
        order,
      ],
    );
    order += 1;
  }
  await putEnvelope(client, 'artists', {
    schemaVersion: artistsFile.schemaVersion,
    generatedAt: artistsFile.generatedAt,
  });

  order = 0;
  for (const venue of venuesFile.venues) {
    await client.query(
      `insert into venue (id, name, city, country, iso_country, address, geo, map_url, document, source_order)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10)`,
      [
        venue.id,
        text(venue.name),
        text(venue.city),
        text(venue.country),
        text(venue.isoCountry),
        text(venue.address),
        json(venue.geo),
        text(venue.mapUrl),
        JSON.stringify(venue),
        order,
      ],
    );
    order += 1;
  }
  await putEnvelope(client, 'venues', { schemaVersion: venuesFile.schemaVersion, generatedAt: venuesFile.generatedAt });

  order = 0;
  for (const partner of partnersFile.partners) {
    await client.query(
      `insert into partner (id, name, city, handle, instagram, document, source_order)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [partner.id, partner.name, partner.city, partner.handle, partner.instagram, JSON.stringify(partner), order],
    );
    order += 1;
  }
  await putEnvelope(client, 'partners', { schemaVersion: partnersFile.schemaVersion, generatedAt: partnersFile.generatedAt });

  order = 0;
  for (const label of labelsFile.labels) {
    await client.query(`insert into label (id, name, document, source_order) values ($1, $2, $3::jsonb, $4)`, [
      label.id,
      label.name,
      JSON.stringify(label),
      order,
    ]);
    order += 1;
  }
  await putEnvelope(client, 'labels', { schemaVersion: labelsFile.schemaVersion, generatedAt: labelsFile.generatedAt });

  order = 0;
  for (const agency of agenciesFile.agencies) {
    await client.query(`insert into agency (id, name, document, source_order) values ($1, $2, $3::jsonb, $4)`, [
      agency.id,
      agency.name,
      JSON.stringify(agency),
      order,
    ]);
    order += 1;
  }
  await putEnvelope(client, 'agencies', { schemaVersion: agenciesFile.schemaVersion, generatedAt: agenciesFile.generatedAt });

  order = 0;
  for (const social of socialsFile) {
    await client.query(
      `insert into social_link (id, platform, label, handle, url, document, source_order)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [social.id, social.platform, social.label, social.handle, social.url, JSON.stringify(social), order],
    );
    order += 1;
  }
  await putEnvelope(client, 'socials', { shape: 'array' });

  return {
    parties: eventsFile.events.length,
    artists: artistsFile.artists.length,
    venues: venuesFile.venues.length,
    partners: partnersFile.partners.length,
    labels: labelsFile.labels.length,
    agencies: agenciesFile.agencies.length,
    socials: socialsFile.length,
  };
}

async function seedShop(client) {
  for (const product of SHOP_PRODUCTS) {
    const document = {
      id: product.id,
      name: product.name,
      whatsappItem: product.whatsappItem,
      image: product.image,
      imageAlt: product.imageAlt,
      highlighted: product.highlighted,
      stockNote: product.stockNote,
      amount: SHOP_PRICE_EUR,
      currency: 'EUR',
      pickup: SHOP_PICKUP,
    };
    await client.query(
      `insert into product (id, name, image, alt, amount, currency, pickup, stock_note, document)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       on conflict (id) do update set
         name = excluded.name,
         image = excluded.image,
         alt = excluded.alt,
         amount = excluded.amount,
         currency = excluded.currency,
         pickup = excluded.pickup,
         stock_note = excluded.stock_note,
         document = excluded.document`,
      [product.id, product.name, product.image, product.imageAlt, SHOP_PRICE_EUR, 'EUR', SHOP_PICKUP, product.stockNote, JSON.stringify(document)],
    );
    await client.query('delete from stock_count where product_id = $1', [product.id]);
    for (const size of product.stock) {
      await client.query('insert into stock_count (product_id, size, count) values ($1, $2, $3)', [product.id, size.code, size.count]);
    }
  }
  return { products: SHOP_PRODUCTS.length, stock: SHOP_PRODUCTS.reduce((sum, product) => sum + product.stock.length, 0) };
}

export async function seed(env = process.env) {
  const settings = databaseSettings(env);
  if (!settings) {
    throw new Error('database settings are incomplete');
  }
  const client = new Client({
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    database: settings.database,
    ssl: sslConfig(settings.servername, env),
  });
  await client.connect();
  try {
    await client.query('begin');
    const catalog = await seedCatalog(client);
    const shop = await seedShop(client);
    await client.query('commit');
    return { ...catalog, ...shop };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const envFile = join(dirname(fileURLToPath(import.meta.url)), '../.env');
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
  seed()
    .then((counts) => {
      process.stdout.write(`seeded ${JSON.stringify(counts)}\n`);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'seed failed';
      process.stderr.write(`${message}\n`);
      process.exit(1);
    });
}
