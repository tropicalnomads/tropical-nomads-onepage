import Link from "next/link";

import { getEvents } from "@/lib/party";

function formatDate(value?: string): string {
  if (!value) return "TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EventsListPage() {
  const events = getEvents("events");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <p className="text-muted-foreground">Discover where Tropical Nomads lands next.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => (
          <Link
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-emerald-400"
            href={`/events-site/events/${event.slug}`}
            key={event.slug}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{event.status || "upcoming"}</p>
            <h2 className="mt-2 text-xl font-semibold">{event.title}</h2>
            <p className="mt-1 text-muted-foreground">
              {formatDate(event.startDate)} · {event.city}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{event.description || "More details soon."}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

