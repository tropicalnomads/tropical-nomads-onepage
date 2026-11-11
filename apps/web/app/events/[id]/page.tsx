import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventDetails } from '../../../src/components/home/EventDetails';
import { loadPublicEvent } from '../../../src/events/load';
import { absoluteAsset, siteOrigin } from '../../../src/seo/urls';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await loadPublicEvent(id);
  if (!event) {
    return {};
  }
  const description = event.description ?? `${event.title} in ${event.city}, ${event.country}.`;
  const url = `${siteOrigin}/events/${encodeURIComponent(event.id)}`;
  const image = event.schemaImage ? absoluteAsset(event.schemaImage) : undefined;
  return {
    title: `${event.title} | Tropical Nomads`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: event.title,
      description,
      url,
      ...(image ? { images: [{ url: image, alt: event.title }] } : {}),
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadPublicEvent(id);
  if (!event) {
    notFound();
  }
  return <EventDetails event={event} />;
}
