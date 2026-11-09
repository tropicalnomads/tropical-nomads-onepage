import { HomePage } from '../src/components/home/HomePage';
import { loadHomeCatalog } from '../src/home/catalog';
import { partitionEvents } from '../src/home/partition';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function Page() {
  const catalog = loadHomeCatalog();
  const { upcoming, past } = partitionEvents(catalog.events);
  return (
    <main>
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
