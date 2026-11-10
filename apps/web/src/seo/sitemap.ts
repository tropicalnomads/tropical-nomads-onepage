import { englishUrl, portugueseUrl, type PublicPath } from './urls.ts';

export interface SitemapEntry {
  loc: string;
  changefreq: 'daily' | 'weekly';
  priority: '1.0' | '0.9' | '0.7';
  english: string;
  portuguese: string;
}

const pages: readonly { path: PublicPath; changefreq: SitemapEntry['changefreq']; priority: SitemapEntry['priority'] }[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/upcoming-events', changefreq: 'daily', priority: '0.9' },
  { path: '/shop', changefreq: 'weekly', priority: '0.7' },
];

function pageEntry(path: PublicPath, changefreq: SitemapEntry['changefreq'], priority: SitemapEntry['priority'], portuguese: boolean): SitemapEntry {
  return {
    loc: portuguese ? portugueseUrl(path) : englishUrl(path),
    changefreq,
    priority,
    english: englishUrl(path),
    portuguese: portugueseUrl(path),
  };
}

export function sitemapEntries(): SitemapEntry[] {
  const entries = pages.flatMap((page) => [pageEntry(page.path, page.changefreq, page.priority, false), pageEntry(page.path, page.changefreq, page.priority, true)]);
  const homeEnglish = englishUrl('/');
  const homePortuguese = portugueseUrl('/');
  entries.push(
    {
      loc: `${homeEnglish}#upcoming-events`,
      changefreq: 'daily',
      priority: '0.9',
      english: homeEnglish,
      portuguese: homePortuguese,
    },
    {
      loc: `${homeEnglish}#gallery`,
      changefreq: 'weekly',
      priority: '0.7',
      english: homeEnglish,
      portuguese: homePortuguese,
    },
  );
  return entries;
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function sitemapXml(): string {
  const urls = sitemapEntries().map((entry) =>
    [
      '  <url>',
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(entry.english)}"/>`,
      `    <xhtml:link rel="alternate" hreflang="pt" href="${escapeXml(entry.portuguese)}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(entry.english)}"/>`,
      '  </url>',
    ].join('\n'),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}
