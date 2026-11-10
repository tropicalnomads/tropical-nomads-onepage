import type { Metadata } from 'next';
import { HomePage } from '../src/components/home/HomePage';
import { loadHomeCatalog } from '../src/home/catalog';
import { partitionEvents } from '../src/home/partition';
import { eventsItemList, jsonLdText, organizationWebsiteGraph, seoEventsFromHome } from '../src/seo/jsonld';
import { publicMetadata } from '../src/seo/metadata';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }): Promise<Metadata> {
  const params = await searchParams;
  return publicMetadata('/', params.lang);
}

export default function Page() {
  const catalog = loadHomeCatalog();
  const { upcoming, past } = partitionEvents(catalog.events);
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(organizationWebsiteGraph()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(eventsItemList(seoEventsFromHome(catalog.events))) }} />
      <HomePage
        upcoming={upcoming}
        past={past}
        partners={catalog.partners}
        socials={catalog.socials}
        followHref={catalog.followHref}
      />
    </main>
  );
}
