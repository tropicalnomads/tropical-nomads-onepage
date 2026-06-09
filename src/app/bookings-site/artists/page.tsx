import Image from "next/image";
import Link from "next/link";

import { getArtists } from "@/lib/party";

export default function ArtistsPage() {
  const artists = getArtists("bookings");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Artists</h1>
        <p className="text-muted-foreground">Our current roster for bookings and tour partnerships.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <Link
            className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-emerald-400"
            href={`/bookings-site/artists/${artist.slug}`}
            key={artist.slug}
          >
            <div className="relative aspect-[4/5] bg-muted">
              {artist.photo ? (
                <Image alt={artist.name} className="object-cover" fill src={artist.photo} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Photo soon</div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <h2 className="text-lg font-semibold">{artist.name}</h2>
              <p className="text-sm text-muted-foreground">{artist.genres?.join(", ") || artist.tags.join(", ")}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

