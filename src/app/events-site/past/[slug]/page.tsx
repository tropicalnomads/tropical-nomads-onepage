import { notFound } from "next/navigation";

import { EditionGalleryLoadMore } from "@/components/edition-gallery-load-more";
import { getEditionGallery, getEditionMeta, listEditions } from "@/lib/party";
import { extractYouTubeId } from "@/lib/youtube";

export function generateStaticParams() {
  return listEditions("events").map((edition) => ({ slug: edition.slug }));
}

export default async function PastEventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = listEditions("events").find((entry) => entry.slug === slug);
  if (!edition) {
    notFound();
  }

  const meta = getEditionMeta("events", edition.id);
  const gallery = getEditionGallery("events", edition.id);
  const youtubeEntries = [...(meta?.youtube || []), ...(gallery.videos || []).filter((video) => video.type === "youtube")]
    .map((entry) => {
      const videoId = extractYouTubeId(entry.url);
      return { title: entry.title, url: entry.url, videoId };
    })
    .filter((entry): entry is { title: string; url: string; videoId: string } => Boolean(entry.videoId));

  const soundcloudEntries = meta?.soundcloud || [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{edition.title}</h1>
        <p className="text-muted-foreground">{meta?.description || "Photos and videos from this edition."}</p>
      </div>

      {youtubeEntries.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Videos</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {youtubeEntries.map((entry) => (
              <div className="space-y-2" key={entry.url}>
                <p className="text-sm text-muted-foreground">{entry.title}</p>
                <div className="aspect-video overflow-hidden rounded-lg border border-border">
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={`https://www.youtube.com/embed/${entry.videoId}`}
                    title={entry.title}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {soundcloudEntries.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Sets</h2>
          <div className="space-y-4">
            {soundcloudEntries.map((entry) => (
              <div className="space-y-2" key={entry.url}>
                <p className="text-sm text-muted-foreground">{entry.title}</p>
                <div className="overflow-hidden rounded-lg border border-border">
                  <iframe
                    allow="autoplay"
                    frameBorder="no"
                    height="166"
                    scrolling="no"
                    src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(entry.url)}&auto_play=false`}
                    title={entry.title}
                    width="100%"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {gallery.images.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Photos</h2>
          <EditionGalleryLoadMore editionTitle={edition.title} gallery={gallery.images} />
        </section>
      )}
    </div>
  );
}

