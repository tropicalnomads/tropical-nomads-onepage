import { webAreas } from 'tropical-nomads-shared';
import { metaDescription } from './copy.ts';
import { siteOrigin } from './urls.ts';

function areaLabel(id: 'upcoming-events' | 'shop'): string {
  const area = webAreas.find((item) => item.id === id);
  if (!area) {
    throw new Error(`missing ${id}`);
  }
  return area.label;
}

export function llmsTxt(): string {
  const upcoming = areaLabel('upcoming-events');
  const shop = areaLabel('shop');
  return `# Tropical Nomads

> ${metaDescription}

English is \`en\`. Portuguese is \`pt\` on the same path with \`?lang=pt\`. Party names, dates, and venues are the published event records on the pages below.

## Pages

- [Tropical Nomads](${siteOrigin}/)
- [Tropical Nomads](${siteOrigin}/?lang=pt)
- [${upcoming}](${siteOrigin}/upcoming-events)
- [${upcoming}](${siteOrigin}/upcoming-events?lang=pt)
- [${shop}](${siteOrigin}/shop)
- [${shop}](${siteOrigin}/shop?lang=pt)

## Optional

- [Tropical Nomads on Instagram](https://www.instagram.com/tropicalnomads.events/)
- [tropicalnomadsbookings](https://www.instagram.com/tropicalnomadsbookings/)
- [Bookings](https://bookings.tropical-nomads.com/)
`;
}
