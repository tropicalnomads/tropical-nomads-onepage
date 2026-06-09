import Link from "next/link";

import { EuropeMap } from "@/components/europe-map";
import { getEvents, getParty, getVenues } from "@/lib/party";

function formatDate(value?: string): string {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EventsHomePage() {
  const config = getParty("events");
  const events = getEvents("events");
  const venues = getVenues("events");
  const nextEvent = events.find((event) => event.status === "upcoming") ?? events[0];

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <p className="text-sm uppercase tracking-[0.22em] text-emerald-300">Events</p>
        <h1 className="mt-3 text-4xl font-bold text-white">{config.name}</h1>
        <p className="mt-3 max-w-3xl text-slate-200">
          {config.tagline || "Parties across Europe with immersive lineups and tropical energy."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white" href="/events-site/events">
            Browse upcoming events
          </Link>
          <Link className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100" href="/events-site/past">
            View past editions
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next event</p>
        <h2 className="mt-2 text-2xl font-semibold">{nextEvent?.title || "TBA"}</h2>
        <p className="mt-1 text-muted-foreground">
          {formatDate(nextEvent?.startDate)} · {nextEvent?.city || "TBA"}
          {nextEvent?.venue ? ` · ${nextEvent.venue}` : ""}
        </p>
        {nextEvent?.ticketUrl && (
          <a
            className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            href={nextEvent.ticketUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Get tickets
          </a>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Party Cities</h2>
          <Link className="text-sm text-emerald-400 hover:underline" href="/events-site/map">
            Open full map
          </Link>
        </div>
        <EuropeMap venues={venues} />
      </section>
    </div>
  );
}

