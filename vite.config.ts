import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const packageJsonPath = fileURLToPath(new URL('./package.json', import.meta.url));
const packageVersion = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version as string;

const SITE_ORIGIN = 'https://www.tropical-nomads.com';

interface SeoEvent {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  venue: { name?: string; city: string; country: string };
  images?: { bannerLocal?: string; full?: string };
  links?: { instagramPost?: string; goabase?: string; tickets?: string; eventbrite?: string };
  cardArtists?: string[];
}

function buildEventsJsonLd(): string {
  const eventsPath = fileURLToPath(new URL('./public/data/events.json', import.meta.url));
  let events: SeoEvent[] = [];
  try {
    events = (JSON.parse(readFileSync(eventsPath, 'utf8')).events ?? []) as SeoEvent[];
  } catch {
    return '';
  }

  const items = events
    .filter((event) => Boolean(event.dateStart))
    .map((event, index) => {
      const image = event.images?.bannerLocal ?? event.images?.full;
      const url =
        event.links?.tickets ?? event.links?.eventbrite ?? event.links?.instagramPost ?? event.links?.goabase;
      const musicEvent: Record<string, unknown> = {
        '@type': 'MusicEvent',
        name: event.title,
        startDate: event.dateStart,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: event.venue.name ?? event.venue.city,
          address: {
            '@type': 'PostalAddress',
            addressLocality: event.venue.city,
            addressCountry: event.venue.country,
          },
        },
        organizer: {
          '@type': 'Organization',
          name: 'Tropical Nomads',
          url: `${SITE_ORIGIN}/`,
        },
      };
      if (event.dateEnd) {
        musicEvent.endDate = event.dateEnd;
      }
      if (image) {
        musicEvent.image = image.startsWith('http') ? image : `${SITE_ORIGIN}${image}`;
      }
      if (url) {
        musicEvent.url = url;
      }
      if (event.cardArtists && event.cardArtists.length > 0) {
        musicEvent.performer = event.cardArtists.map((name) => ({ '@type': 'MusicGroup', name }));
      }
      return { '@type': 'ListItem', position: index + 1, item: musicEvent };
    });

  const graph = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tropical Nomads Events',
    itemListElement: items,
  };

  return `<script type="application/ld+json">${JSON.stringify(graph)}</script>`;
}

function eventsSeoPlugin(): Plugin {
  return {
    name: 'tropical-nomads-events-seo',
    transformIndexHtml(html) {
      return html.replace('<!-- @events-jsonld -->', buildEventsJsonLd());
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    eventsSeoPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
      ],
      manifest: {
        name: 'Tropical Nomads Events',
        short_name: 'TN Events',
        description: 'Tropical Nomads events page with upcoming and past gatherings.',
        theme_color: '#042f2e',
        background_color: '#042f2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
