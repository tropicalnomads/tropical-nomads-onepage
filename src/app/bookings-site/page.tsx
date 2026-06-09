import Link from "next/link";

import { getArtists, getParty } from "@/lib/party";

export default function BookingsHomePage() {
  const config = getParty("bookings");
  const artists = getArtists("bookings").slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <p className="text-sm uppercase tracking-[0.22em] text-emerald-300">Bookings</p>
        <h1 className="mt-3 text-4xl font-bold text-white">{config.name}</h1>
        <p className="mt-3 max-w-3xl text-slate-200">
          {config.tagline || "Book Tropical Nomads artists for clubs, festivals, and curated events."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white" href="/bookings-site/artists">
            Explore roster
          </Link>
          <Link className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100" href="/bookings-site/contact">
            Request booking
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Featured artists</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {artists.map((artist) => (
            <Link
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-emerald-400"
              href={`/bookings-site/artists/${artist.slug}`}
              key={artist.slug}
            >
              <h3 className="text-lg font-semibold">{artist.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{artist.tags.join(" · ")}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {artist.availableForBooking ? "Available for booking" : "Limited availability"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

