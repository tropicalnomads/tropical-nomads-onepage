import { sitemapXml } from '../../src/seo/sitemap.ts';

export function GET(): Response {
  return new Response(sitemapXml(), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
