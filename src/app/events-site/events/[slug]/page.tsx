import { notFound } from "next/navigation";

import { getArtists, getEvents } from "@/lib/party";

function formatDate(value?: string): string {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function generateStaticParams() {
  return getEvents("events").map((event) => ({ slug: event.slug }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvents("events").find((entry) => entry.slug === slug);

  if (!event) {
    notFound();
  }

  const artists = getArtists("events");
  const artistMap = new Map(artists.map((artist) => [artist.slug, artist.name]));

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{event.status || "upcoming"}</p>
        <h1 className="text-4xl font-bold">{event.title}</h1>
        <p className="text-muted-foreground">
          {formatDate(event.startDate)} · {event.city}
          {event.venue ? ` · ${event.venue}` : ""}
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-muted-foreground">{event.description || "Event details will be announced soon."}</p>
        {event.ticketUrl && (
          <a
            className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            href={event.ticketUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Buy tickets
          </a>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Lineup</h2>
        {event.lineup && event.lineup.length > 0 ? (
          <ul className="grid gap-2 rounded-xl border border-border bg-card p-6">
            {event.lineup.map((lineupItem) => (
              <li key={lineupItem.artistSlug} className="text-sm text-foreground/90">
                {artistMap.get(lineupItem.artistSlug) || lineupItem.artistSlug}
                {lineupItem.headliner ? " (headliner)" : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Lineup will be announced soon.</p>
        )}
      </section>
    </article>
  );
}

