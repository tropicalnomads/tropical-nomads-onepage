import { notFound } from "next/navigation";

import { extractYouTubeId } from "@/lib/youtube";
import { getArtists } from "@/lib/party";

export function generateStaticParams() {
  return getArtists("bookings").map((artist) => ({ slug: artist.slug }));
}

export default async function ArtistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = getArtists("bookings").find((item) => item.slug === slug);
  if (!artist) {
    notFound();
  }

  const youtubeEmbed = artist.embeds?.youtube?.[0];
  const youtubeId = youtubeEmbed ? extractYouTubeId(youtubeEmbed) : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">{artist.name}</h1>
        <p className="text-muted-foreground">{artist.genres?.join(", ") || artist.tags.join(", ")}</p>
      </header>

      <section className="rounded-xl border border-border bg-card p-6">
        {Array.isArray(artist.bio) ? (
          <div className="space-y-3">
            {artist.bio.map((paragraph) => (
              <p key={paragraph} className="text-foreground/90">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-foreground/90">{artist.bio || "Full profile coming soon."}</p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {artist.embeds?.soundcloud?.[0] && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">SoundCloud</h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                allow="autoplay"
                frameBorder="no"
                height="166"
                scrolling="no"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(artist.embeds.soundcloud[0])}&auto_play=false`}
                title={`${artist.name} soundcloud`}
                width="100%"
              />
            </div>
          </div>
        )}
        {youtubeId && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">YouTube</h2>
            <div className="aspect-video overflow-hidden rounded-lg border border-border">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
                referrerPolicy="strict-origin-when-cross-origin"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`${artist.name} youtube`}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

