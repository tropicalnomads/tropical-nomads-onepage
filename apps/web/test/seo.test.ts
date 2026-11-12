import assert from 'node:assert/strict';
import { readFileSync, readlinkSync } from 'node:fs';
import { describe, it } from 'node:test';
import { webAreas } from 'tropical-nomads-shared';
import { GET as healthGet } from '../app/health/route.ts';
import { GET as llmsGet } from '../app/llms.txt/route.ts';
import { GET as robotsGet } from '../app/robots.txt/route.ts';
import { GET as sitemapGet } from '../app/sitemap.xml/route.ts';
import { loadHomeCatalog } from '../src/home/catalog.ts';
import { shellCopy } from '../src/i18n/copy.ts';
import {
  authorName,
  documentTitle,
  imageAlt,
  indexRobots,
  keywords,
  metaDescription,
  openGraphDescription,
  openGraphTitle,
  twitterDescription,
  twitterSite,
  websiteDescription,
} from '../src/seo/copy.ts';
import { withNoindex } from '../src/seo/headers.ts';
import { eventsItemList, organizationWebsiteGraph, sameAs, seoEventsFromHome, type SeoEventInput } from '../src/seo/jsonld.ts';
import { llmsTxt } from '../src/seo/llms.ts';
import { publicMetadata, rootMetadata } from '../src/seo/metadata.ts';
import { robotAgents, robotDisallows, robotsTxt } from '../src/seo/robots.ts';
import { sitemapEntries, sitemapXml } from '../src/seo/sitemap.ts';
import { canonicalUrl, isPublicPath, localeFromHeader, localeFromLangParam, publicHref, searchLinks, siteOrigin } from '../src/seo/urls.ts';

const privatePaths = ['/account', '/account/sign-in', '/account/register', '/my-tickets', '/my-orders', '/check-in', '/health', '/admin', '/shop/cart'];

const expectedLlms = `# Tropical Nomads

> ${metaDescription}

English is \`en\`. Portuguese is \`pt\` on the same path with \`?lang=pt\`. Party names, dates, and venues are the published event records on the pages below.

## Pages

- [Tropical Nomads](${siteOrigin}/)
- [Tropical Nomads](${siteOrigin}/?lang=pt)
- [Upcoming events](${siteOrigin}/upcoming-events)
- [Upcoming events](${siteOrigin}/upcoming-events?lang=pt)
- [Shop](${siteOrigin}/shop)
- [Shop](${siteOrigin}/shop?lang=pt)

## Optional

- [Tropical Nomads on Instagram](https://www.instagram.com/tropicalnomads.events/)
- [tropicalnomadsbookings](https://www.instagram.com/tropicalnomadsbookings/)
- [Bookings](https://bookings.tropical-nomads.com/)
`;

function openGraphOf(path: '/' | '/upcoming-events' | '/shop', lang?: string) {
  const metadata = publicMetadata(path, lang);
  const graph = metadata.openGraph;
  if (!graph || !('locale' in graph) || !('images' in graph)) {
    throw new Error('missing website card');
  }
  assert.equal('type' in graph ? graph.type : undefined, 'website');
  return { metadata, graph };
}

function imageFields(image: unknown): { url: string; secureUrl: string | undefined; alt: string | undefined } {
  if (!image || typeof image !== 'object' || !('url' in image)) {
    throw new Error('missing image');
  }
  const record = image as { url: string | URL; secureUrl?: string | URL; alt?: string };
  return {
    url: String(record.url),
    secureUrl: record.secureUrl === undefined ? undefined : String(record.secureUrl),
    alt: record.alt,
  };
}

describe('public search metadata', () => {
  it('copies the one-pager title, description, and cards onto the dev origin', () => {
    const onePager = readFileSync(new URL('../../one-pager/index.html', import.meta.url), 'utf8');
    assert.equal(onePager.includes(`<title>${documentTitle}</title>`), true);
    assert.equal(onePager.includes(metaDescription), true);
    assert.equal(onePager.includes(keywords), true);
    assert.equal(onePager.includes('https://www.tropical-nomads.com/'), true);

    for (const path of ['/', '/upcoming-events', '/shop'] as const) {
      const { metadata, graph } = openGraphOf(path);
      assert.deepEqual(metadata.title, { absolute: documentTitle });
      assert.equal(metadata.description, metaDescription);
      assert.equal(metadata.keywords, keywords);
      assert.equal(metadata.applicationName, authorName);
      assert.deepEqual(metadata.authors, [{ name: authorName }]);
      assert.equal(metadata.robots, indexRobots);
      assert.equal(metadata.other?.googlebot, indexRobots);
      const links = searchLinks(path, undefined);
      assert.equal(links.canonical, canonicalUrl(path, undefined));
      assert.equal(links.canonical.includes('source=pwa'), false);
      assert.deepEqual(links, {
        canonical: `${siteOrigin}${path === '/' ? '/' : path}`,
        english: `${siteOrigin}${path === '/' ? '/' : path}`,
        portuguese: `${siteOrigin}${path === '/' ? '/' : path}?lang=pt`,
      });
      assert.equal(metadata.alternates, undefined);
      assert.equal(graph.locale, 'en_US');
      assert.deepEqual(graph.alternateLocale, ['pt_BR']);
      assert.equal(graph.url, undefined);
      assert.equal(graph.siteName, authorName);
      assert.equal(graph.title, openGraphTitle);
      assert.equal(graph.description, openGraphDescription);
      const images = graph.images;
      const image = imageFields(Array.isArray(images) ? images[0] : images);
      assert.equal(image.url, `${siteOrigin}/og-image.png`);
      assert.equal(image.secureUrl, `${siteOrigin}/og-image.png`);
      assert.equal(image.alt, imageAlt);
      const twitter = metadata.twitter;
      assert.equal(twitter && 'card' in twitter ? twitter.card : undefined, 'summary_large_image');
      assert.equal(twitter && 'site' in twitter ? twitter.site : undefined, twitterSite);
      assert.equal(twitter && 'description' in twitter ? twitter.description : undefined, twitterDescription);
    }

    const portuguese = openGraphOf('/', 'pt');
    assert.equal(searchLinks('/', 'pt').canonical, `${siteOrigin}/?lang=pt`);
    assert.equal(portuguese.graph.locale, 'pt_BR');
    assert.deepEqual(portuguese.graph.alternateLocale, ['en_US']);
    assert.equal(portuguese.graph.title, openGraphTitle);
    assert.equal(canonicalUrl('/shop', 'en'), `${siteOrigin}/shop`);
    assert.equal(canonicalUrl('/shop', 'fr'), `${siteOrigin}/shop`);
    assert.equal(canonicalUrl('/upcoming-events', 'pt-BR'), `${siteOrigin}/upcoming-events`);
    assert.equal(canonicalUrl('/upcoming-events', 'pt'), `${siteOrigin}/upcoming-events?lang=pt`);
  });

  it('keeps private routes out of the index and the language URL', () => {
    assert.deepEqual(rootMetadata.robots, { index: false, follow: false });
    assert.equal(rootMetadata.description, undefined);
    assert.equal(String(rootMetadata.title).includes('Psytrance with a Brazilian touch'), false);
    for (const path of privatePaths) {
      assert.equal(isPublicPath(path), false, path);
    }
    assert.equal(localeFromLangParam('pt'), 'pt');
    assert.equal(localeFromLangParam('pt-BR'), 'en');
    assert.equal(localeFromLangParam(['en']), 'en');
    assert.equal(localeFromHeader('pt'), 'pt');
    assert.equal(localeFromHeader('en'), 'en');
    assert.equal(localeFromHeader('fr'), null);
    assert.equal(publicHref('/', 'en'), '/');
    assert.equal(publicHref('/', 'pt'), '/?lang=pt');
    assert.equal(publicHref('/shop', 'pt'), '/shop?lang=pt');
    assert.equal(publicHref('/upcoming-events', 'pt'), '/upcoming-events?lang=pt');
    assert.equal(publicHref('/my-tickets', 'pt'), '/my-tickets');
    assert.equal(publicHref('/shop/cart', 'pt'), '/shop/cart');
    assert.equal(publicHref('/account', 'pt'), '/account');
  });
});

describe('search files', () => {
  it('publishes robots groups that each disallow the private prefixes', () => {
    const text = robotsTxt();
    const blocks = text.trimEnd().split('\n\n');
    const sitemap = blocks.pop();
    assert.equal(sitemap, `Sitemap: ${siteOrigin}/sitemap.xml`);
    assert.equal(blocks.length, robotAgents.length);
    blocks.forEach((block, index) => {
      assert.equal(block.startsWith(`User-agent: ${robotAgents[index]}`), true);
      assert.equal(block.includes('Allow: /'), true);
      for (const path of robotDisallows) {
        assert.equal(block.includes(`Disallow: ${path}`), true);
      }
    });
    assert.equal(text.includes('Disallow: /catalog-assets'), false);
    assert.equal(text.includes('CCBot'), false);
    assert.equal(text.includes('Amazonbot'), false);
    assert.equal(text.includes('Bytespider'), false);
    const onePager = readFileSync(new URL('../../one-pager/public/robots.txt', import.meta.url), 'utf8');
    assert.equal(onePager.includes('https://www.tropical-nomads.com/sitemap.xml'), true);
    assert.equal(onePager.includes(siteOrigin), false);
  });

  it('lists the public locs and the home fragments', () => {
    assert.deepEqual(
      sitemapEntries().map((entry) => [entry.loc, entry.changefreq, entry.priority, entry.english, entry.portuguese]),
      [
        [`${siteOrigin}/`, 'daily', '1.0', `${siteOrigin}/`, `${siteOrigin}/?lang=pt`],
        [`${siteOrigin}/?lang=pt`, 'daily', '1.0', `${siteOrigin}/`, `${siteOrigin}/?lang=pt`],
        [`${siteOrigin}/upcoming-events`, 'daily', '0.9', `${siteOrigin}/upcoming-events`, `${siteOrigin}/upcoming-events?lang=pt`],
        [`${siteOrigin}/upcoming-events?lang=pt`, 'daily', '0.9', `${siteOrigin}/upcoming-events`, `${siteOrigin}/upcoming-events?lang=pt`],
        [`${siteOrigin}/shop`, 'weekly', '0.7', `${siteOrigin}/shop`, `${siteOrigin}/shop?lang=pt`],
        [`${siteOrigin}/shop?lang=pt`, 'weekly', '0.7', `${siteOrigin}/shop`, `${siteOrigin}/shop?lang=pt`],
        [`${siteOrigin}/#upcoming-events`, 'daily', '0.9', `${siteOrigin}/`, `${siteOrigin}/?lang=pt`],
        [`${siteOrigin}/#gallery`, 'weekly', '0.7', `${siteOrigin}/`, `${siteOrigin}/?lang=pt`],
      ],
    );
    const xml = sitemapXml();
    assert.equal(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), true);
    assert.equal(xml.includes('hreflang="x-default"'), true);
    for (const path of ['/account', '/my-tickets', '/my-orders', '/check-in', '/health', '/privacy', '/merch']) {
      assert.equal(xml.includes(path), false, path);
    }
  });

  it('serves the AI-search file with the shop label and no extra parties', () => {
    const shop = webAreas.find((area) => area.id === 'shop');
    assert.equal(shop?.label, 'Shop');
    assert.equal(shop?.path, '/shop');
    assert.equal(llmsTxt(), expectedLlms);
    assert.equal(llmsTxt().includes(`[${shellCopy.en.navBookings}](https://bookings.tropical-nomads.com/)`), true);
    assert.equal(llmsTxt().includes('psy.groove'), false);
    assert.equal(llmsTxt().includes('facebook.com'), false);
    assert.equal(llmsTxt().includes('/merch'), false);
    for (const path of privatePaths) {
      assert.equal(llmsTxt().includes(path), false, path);
    }
  });

  it('serves the three files and marks the private handlers noindex', async () => {
    const robots = await robotsGet();
    const sitemap = await sitemapGet();
    const llms = await llmsGet();
    assert.equal(robots.headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal(sitemap.headers.get('content-type'), 'application/xml; charset=utf-8');
    assert.equal(llms.headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal(await robots.text(), robotsTxt());
    assert.equal(await sitemap.text(), sitemapXml());
    assert.equal(await llms.text(), llmsTxt());
    const health = await healthGet();
    assert.equal(health.headers.get('x-robots-tag'), 'noindex, nofollow');
    const redirected = withNoindex(Response.redirect('https://dev.tropical-nomads.com/account/sign-in'));
    assert.equal(redirected.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(redirected.status, 302);
    const callback = readFileSync(new URL('../app/account/callback/route.ts', import.meta.url), 'utf8');
    const avatar = readFileSync(new URL('../app/account/avatar/route.ts', import.meta.url), 'utf8');
    assert.equal(callback.includes('withNoindex(Response.redirect'), true);
    assert.equal(callback.includes('return Response.redirect'), false);
    assert.equal(avatar.includes('return new Response'), false);
    assert.equal(avatar.includes('withNoindex(new Response'), true);
  });
});

describe('structured data', () => {
  it('maps published events with the plugin fields and skips a party without a start date', () => {
    const dated: SeoEventInput = {
      title: 'Fixture Party',
      dateStart: '2026-10-24T19:00:00+02:00',
      dateEnd: '2026-10-25T03:00:00+01:00',
      venueName: 'The Sound House',
      city: 'Dublin',
      country: 'Ireland',
      image: '/catalog-assets/banners/fixture.jpg',
      ticketUrl: 'https://tickets.example/party',
      instagramPost: 'https://www.instagram.com/p/fixture',
      goabaseUrl: 'https://www.goabase.net/party/fixture',
      cardArtists: ['FNX'],
    };
    const list = eventsItemList([
      { title: 'No Date', city: 'Dublin', country: 'Ireland' },
      dated,
    ]);
    assert.equal(list.name, 'Tropical Nomads Events');
    assert.equal(list.itemListElement.length, 1);
    const item = list.itemListElement[0]?.item;
    assert.equal(list.itemListElement[0]?.position, 1);
    assert.equal(item?.name, 'Fixture Party');
    assert.equal(item?.startDate, dated.dateStart);
    assert.equal(item?.endDate, dated.dateEnd);
    assert.equal(item?.eventStatus, 'https://schema.org/EventScheduled');
    assert.equal(item?.eventAttendanceMode, 'https://schema.org/OfflineEventAttendanceMode');
    assert.equal(item?.location.name, 'The Sound House');
    assert.equal(item?.location.address.addressLocality, 'Dublin');
    assert.equal(item?.location.address.addressCountry, 'Ireland');
    assert.equal(item?.image, `${siteOrigin}/catalog-assets/banners/fixture.jpg`);
    assert.equal(item?.url, 'https://tickets.example/party');
    assert.deepEqual(item?.performer, [{ '@type': 'MusicGroup', name: 'FNX' }]);
    assert.deepEqual(item?.organizer, { '@type': 'Organization', name: 'Tropical Nomads', url: `${siteOrigin}/` });
    const serialized = JSON.stringify(list);
    assert.equal(serialized.includes('No Date'), false);
    assert.equal(serialized.includes('streetAddress'), false);
    assert.equal(serialized.includes('Secret Stage'), false);
    assert.equal(serialized.includes('fixture-price'), false);

    const instagram = eventsItemList([
      { title: 'Instagram only', dateStart: '2026-01-01T00:00:00Z', city: 'Berlin', country: 'Germany', instagramPost: 'https://www.instagram.com/p/abc', goabaseUrl: 'https://www.goabase.net/party/abc' },
    ]);
    assert.equal(instagram.itemListElement[0]?.item.url, 'https://www.instagram.com/p/abc');
    const goabase = eventsItemList([{ title: 'Goabase only', dateStart: '2026-01-01T00:00:00Z', city: 'Lisbon', country: 'Portugal', goabaseUrl: 'https://www.goabase.net/party/lisbon' }]);
    assert.equal(goabase.itemListElement[0]?.item.url, 'https://www.goabase.net/party/lisbon');
    const cityNamed = eventsItemList([{ title: 'City venue', dateStart: '2026-02-01T00:00:00Z', city: 'Amsterdam', country: 'Netherlands', image: 'https://img.example/flyer.png', cardArtists: [] }]);
    assert.equal(cityNamed.itemListElement[0]?.item.location.name, 'Amsterdam');
    assert.equal(cityNamed.itemListElement[0]?.item.image, 'https://img.example/flyer.png');
    assert.equal(cityNamed.itemListElement[0]?.item.performer, undefined);

    const catalog = loadHomeCatalog();
    const published = eventsItemList(seoEventsFromHome(catalog.events));
    assert.equal(published.itemListElement.length, catalog.events.length);
    const graph = organizationWebsiteGraph();
    assert.deepEqual(graph['@graph'][0]?.sameAs, [...sameAs]);
    assert.equal(graph['@graph'][0]?.['@id'], `${siteOrigin}/#organization`);
    assert.equal(graph['@graph'][1]?.['@id'], `${siteOrigin}/#website`);
    assert.equal(graph['@graph'][1]?.description, websiteDescription);
    assert.deepEqual(graph['@graph'][1]?.inLanguage, ['en', 'pt']);
    const socials = JSON.parse(readFileSync(new URL('../../one-pager/public/data/socials.json', import.meta.url), 'utf8')) as { url: string }[];
    for (const social of socials) {
      if (social.url.includes('psy.groove') || social.url.includes('facebook.com')) {
        assert.equal(JSON.stringify(graph).includes(social.url), false, social.url);
      }
    }
    const joined = `${JSON.stringify(graph)}${JSON.stringify(published)}${robotsTxt()}${sitemapXml()}${llmsTxt()}`;
    for (const secret of ['password', 'cognito', 'session', 'cookie']) {
      assert.equal(joined.toLowerCase().includes(secret), false, secret);
    }
  });
});

describe('tab icons', () => {
  it('serves the one-pager icon bytes and the events manifest', () => {
    const files = ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'og-image.png'];
    for (const file of files) {
      const link = readlinkSync(new URL(`../public/${file}`, import.meta.url)).replaceAll('\\', '/');
      assert.equal(link, `../../one-pager/public/${file}`);
      const web = readFileSync(new URL(`../public/${file}`, import.meta.url));
      const source = readFileSync(new URL(`../../one-pager/public/${file}`, import.meta.url));
      assert.equal(Buffer.compare(web, source), 0);
    }
    const icons = readlinkSync(new URL('../public/icons', import.meta.url)).replaceAll('\\', '/').replace(/\/$/, '');
    assert.equal(icons, '../../one-pager/public/icons');
    const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8')) as {
      name: string;
      short_name: string;
      description: string;
      theme_color: string;
      background_color: string;
      display: string;
      orientation: string;
      scope: string;
      start_url: string;
      icons: { src: string; purpose: string }[];
    };
    assert.equal(manifest.name, 'Tropical Nomads Events');
    assert.equal(manifest.short_name, 'TN Events');
    assert.equal(manifest.description, 'Tropical Nomads events page with upcoming and past gatherings.');
    assert.equal(manifest.theme_color, '#042f2e');
    assert.equal(manifest.background_color, '#042f2e');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.orientation, 'portrait');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.start_url, '/?source=pwa');
    assert.deepEqual(
      manifest.icons.map((icon) => `${icon.src} ${icon.purpose}`),
      ['/icons/icon-192.png any', '/icons/icon-512.png any', '/icons/maskable-192.png maskable', '/icons/maskable-512.png maskable'],
    );
  });
});
