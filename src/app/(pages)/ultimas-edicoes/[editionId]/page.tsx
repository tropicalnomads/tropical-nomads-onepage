import { notFound } from "next/navigation";
import { getEditionGallery, getEditionMeta, listEditions } from "@/lib/party";
import { Card } from "@/components/ui/card";
import { extractYouTubeId } from "@/lib/youtube";
import { EditionGalleryLoadMore } from "@/components/edition-gallery-load-more";

export function generateStaticParams() {
  return listEditions()
    .filter((edition) => edition.id !== "3")
    .map((edition) => ({ editionId: edition.id }));
}

export default async function EditionMediaPage({
  params,
}: {
  params: Promise<{ editionId: string }>;
}) {
  const { editionId } = await params;
  const edition = listEditions().find((item) => item.id === editionId);

  if (!edition || edition.id === "3") {
    return notFound();
  }

  const meta = getEditionMeta(editionId);
  const gallery = getEditionGallery(editionId);
  const youtubeEntries = (meta?.youtube ?? [])
    .map((entry) => ({ ...entry, videoId: extractYouTubeId(entry.url) }))
    .filter((entry): entry is { title: string; url: string; videoId: string } => Boolean(entry.videoId));
  const soundcloudEntries = meta?.soundcloud ?? [];
  const hasMedia = gallery.length > 0 || youtubeEntries.length > 0 || soundcloudEntries.length > 0;

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary">{edition.title}</h1>
        <p className="text-muted-foreground">{meta?.description || "Conteúdos da edição."}</p>
      </div>

      {youtubeEntries.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Vídeos</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {youtubeEntries.map((entry) => (
              <div key={entry.url} className="space-y-2">
                <p className="text-sm text-muted-foreground">{entry.title}</p>
                <div className="w-full aspect-video overflow-hidden rounded-md border border-secondary/30">
                  <iframe
                    title={entry.title}
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${entry.videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {soundcloudEntries.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Sets</h2>
          <div className="grid grid-cols-1 gap-4">
            {soundcloudEntries.map((entry) => (
              <div key={entry.url} className="space-y-2">
                <p className="text-sm text-muted-foreground">{entry.title}</p>
                <div className="w-full overflow-hidden rounded-md border border-secondary/30">
                  <iframe
                    title={entry.title}
                    width="100%"
                    height="166"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay"
                    src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(entry.url)}&color=%23bda64d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">Fotos</h2>
          <EditionGalleryLoadMore gallery={gallery} editionTitle={edition.title} />
        </section>
      ) : null}

      {!hasMedia ? (
        <Card className="border border-secondary/30 p-8 text-center text-muted-foreground">
          Conteúdo em atualização.
        </Card>
      ) : null}
    </div>
  );
}
