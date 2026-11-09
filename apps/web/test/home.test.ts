import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { formatEventDate, locales } from 'tropical-nomads-shared';
import { catalogAsset } from '../src/events/assets.ts';
import { loadHomeCatalog } from '../src/home/catalog.ts';
import { partitionEvents } from '../src/home/partition.ts';
import { pastSummary, upcomingSummary } from '../src/home/summary.ts';
import { navigation } from '../src/navigation.ts';
import { shellCopy } from '../src/i18n/copy.ts';
import { homeCopy, homePastCount, homeShowMore, type HomeCopy } from '../src/i18n/home.ts';

const liveToday = new Date(2026, 10, 9, 12, 0, 0);
const translations = readFileSync(new URL('../../one-pager/src/i18n/translations.ts', import.meta.url), 'utf8');
const hero = readFileSync(new URL('../../one-pager/src/components/HeroSection.tsx', import.meta.url), 'utf8');

function httpsLink(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') {
      return undefined;
    }
    return value.trim();
  } catch {
    return undefined;
  }
}

describe('homepage catalog', () => {
  it('uses the live events, partners, photos, and links', () => {
    const catalog = loadHomeCatalog();
    const eventsFile = JSON.parse(readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8')) as {
      events: {
        id: string;
        title: string;
        links?: { eventbrite?: string; tickets?: string; goabase?: string; instagramPost?: string };
        images?: { bannerLocal?: string };
      }[];
    };
    const partnersFile = JSON.parse(readFileSync(new URL('../../one-pager/public/data/partners.json', import.meta.url), 'utf8')) as {
      partners: { id: string; name: string; instagram: string; city: string }[];
    };
    const socialsFile = JSON.parse(readFileSync(new URL('../../one-pager/public/data/socials.json', import.meta.url), 'utf8')) as {
      id: string;
      label: string;
      url: string;
    }[];

    assert.deepEqual(
      catalog.events.map((event) => event.id),
      eventsFile.events.map((event) => event.id),
    );
    assert.deepEqual(
      catalog.partners.map((partner) => partner.id),
      partnersFile.partners.map((partner) => partner.id),
    );
    assert.deepEqual(
      catalog.socials.map((link) => link.id),
      socialsFile.map((link) => link.id),
    );

    for (const event of catalog.events) {
      const source = eventsFile.events.find((item) => item.id === event.id);
      assert.ok(source);
      assert.equal(event.title, source.title);
      const ticketUrl = httpsLink(source.links?.eventbrite) ?? httpsLink(source.links?.tickets) ?? httpsLink(source.links?.goabase);
      assert.equal(event.ticketUrl, ticketUrl);
      assert.equal(event.instagramPost, httpsLink(source.links?.instagramPost));
      const banner = source.images?.bannerLocal;
      if (banner?.startsWith('/events/banners/')) {
        const file = banner.slice('/events/banners/'.length);
        if (catalogAsset('banners', file)) {
          assert.equal(event.bannerSrc, `/catalog-assets/banners/${file}`);
        }
      }
      assert.equal(JSON.stringify(event).includes('secret'), false);
    }

    for (const partner of catalog.partners) {
      const source = partnersFile.partners.find((item) => item.id === partner.id);
      assert.ok(source);
      assert.equal(partner.name, source.name);
      assert.equal(partner.city, source.city);
      assert.equal(partner.instagram, source.instagram);
      assert.equal(partner.logoSrc?.startsWith('/catalog-assets/partners/'), true);
    }

    assert.equal(catalog.followHref, 'https://www.instagram.com/tropicalnomads.events/');
    assert.match(hero, new RegExp(`href="${catalog.followHref}"`));
    assert.deepEqual(
      catalog.socials.map((link) => link.url),
      socialsFile.map((link) => link.url),
    );
  });

  it('matches the live section lists for 9 November 2026', () => {
    const catalog = loadHomeCatalog();
    const { upcoming, past } = partitionEvents(catalog.events, liveToday);
    assert.deepEqual(
      upcoming.map((event) => event.title),
      ['Tropical Groove - Kobot, Middle-D & Deutsch', 'Forest Shankara #3 — Sacred Pulse'],
    );
    assert.equal(past.length, 15);
    assert.deepEqual(
      past.slice(0, 3).map((event) => event.title),
      [
        'Tropical Groove: Pre-Halloween 2nd Edition with FNX',
        'Tropical Nomads Showcase — Athens',
        'Tropical Nomads presents: Technology & ARAM',
      ],
    );
    const groove = upcoming[0];
    const forest = upcoming[1];
    const athens = past[1];
    const preHalloween = past[0];
    assert.ok(groove && forest && athens && preHalloween);
    assert.equal(formatEventDate(groove, 'en'), 'November 20, 2026');
    assert.equal(formatEventDate(forest, 'en'), 'December 5–6, 2026');
    assert.equal(formatEventDate(athens, 'en', 'medium'), 'Oct 4, 2026');
    assert.equal(
      upcomingSummary(groove),
      "After June · Araujah · Blazin'G · Deutsch · Kobot · Middle-D · Octo · Respecter · Shivaion · Vinius",
    );
    assert.equal(upcomingSummary(forest), 'Elowinz · Cyk · Inside Mind · FNX +18');
    assert.equal(pastSummary(preHalloween), 'FNX · Valkyrie · 3rd Vision +8');
    assert.equal(groove.ticketUrl, 'https://tropicalgroove-kobot.eventbrite.ie');
    assert.equal(forest.ticketUrl, 'https://uticket.com.br/evento/forest-shankara-sacred-pulse/01LZ9CCY0UCE1W');
    assert.equal(groove.ticketsOnSale, true);
    assert.equal(forest.ticketsOnSale, true);
  });
});

describe('homepage copy', () => {
  it('reuses the live English and Portuguese sentences', () => {
    assert.equal(shellCopy.en.home, homeCopy.en);
    assert.equal(shellCopy.pt.home, homeCopy.pt);
    assert.deepEqual(Object.keys(homeCopy.en).sort(), Object.keys(homeCopy.pt).sort());
    for (const language of locales) {
      for (const [key, value] of Object.entries(homeCopy[language]) as [keyof HomeCopy, string][]) {
        assert.notEqual(value.trim(), '', `${language}.${key}`);
        const livePhrase = value.includes('{') ? value.replaceAll('{', '${') : value;
        assert.equal(translations.includes(livePhrase), true, `${language}.${key}`);
      }
    }
    assert.equal(homeCopy.en.exploreUpcoming, 'Explore upcoming events');
    assert.equal(homeCopy.en.followJourney, 'Follow our journey');
    assert.equal(homeCopy.pt.exploreUpcoming, 'Explorar próximos eventos');
    assert.equal(homeCopy.pt.followJourney, 'Acompanhe nossa jornada');
    assert.equal(homePastCount('en', 3, 15), 'Showing 3 of 15 events');
    assert.equal(homePastCount('pt', 3, 15), 'Mostrando 3 de 15 eventos');
    assert.equal(homePastCount('en', 1, 1), '1 event');
    assert.equal(homePastCount('pt', 1, 1), '1 evento');
    assert.equal(homeShowMore('en', 6), 'Show 6 more');
    assert.equal(homeShowMore('pt', 6), 'Mostrar mais 6');
  });
});

describe('homepage shell', () => {
  it('keeps the app routes and puts the live sections on the home page', () => {
    for (const item of navigation) {
      assert.equal(item.href.startsWith('/'), true, item.href);
      assert.equal(item.href.includes('#'), false, item.href);
    }
    const header = readFileSync(new URL('../src/components/ShellHeader.tsx', import.meta.url), 'utf8');
    const page = readFileSync(new URL('../src/components/home/HomePage.tsx', import.meta.url), 'utf8');
    const upcoming = readFileSync(new URL('../src/components/home/UpcomingSection.tsx', import.meta.url), 'utf8');
    assert.equal(header.includes('href="/"'), true);
    assert.equal(header.includes('#upcoming-events'), false);
    assert.equal(header.includes('#gallery'), false);
    const heroAt = page.indexOf('<HeroCard');
    const upcomingAt = page.indexOf('<UpcomingSection');
    const pastAt = page.indexOf('<PastSection');
    const partnersAt = page.indexOf('<PartnersSection');
    const socialsAt = page.indexOf('<StayConnected');
    assert.ok(heroAt >= 0 && heroAt < upcomingAt && upcomingAt < pastAt && pastAt < partnersAt && partnersAt < socialsAt);
    assert.equal(page.includes('MerchSection'), false);
    assert.equal(upcoming.includes('issueTicketAction'), false);
    assert.equal(upcoming.includes('<form'), false);
  });
});
