import Image from "next/image"
import { notFound } from "next/navigation"
import { getArtists } from "@/lib/party"
import { Card } from "@/components/ui/card"
import { H1, H3, P } from "@/components/ui/typography"
import { TextButton } from "@/components/ui/text-button"
import { ArrowLeft } from "lucide-react"
import { extractYouTubeId } from "@/lib/youtube"

export function generateStaticParams() {
  return getArtists().map((a) => ({ slug: a.slug }))
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = getArtists().find((a) => a.slug === slug)
  if (!artist) return notFound()
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 relative">
      <div className="flex flex-col md:block">
        <TextButton href="/lineup" className="mb-4 md:absolute md:top-0 md:left-0 md:z-10">
          <ArrowLeft />
          Voltar ao Lineup
        </TextButton>
        <div className="text-center">
          <H1 className="text-3xl md:text-4xl font-bold">{artist.name}</H1>
        </div>
      </div>
      <div className="space-y-3 text-center">
        {artist.agency && <P className="text-muted-foreground">{artist.agency}</P>}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {artist.links?.instagram && (
            <a href={artist.links.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors">Instagram</a>
          )}
          {artist.links?.youtube && (
            <a href={artist.links.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors">YouTube</a>
          )}
          {artist.links?.soundcloud && (
            <a href={artist.links.soundcloud} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors">SoundCloud</a>
          )}
          {artist.links?.facebook && (
            <a href={artist.links.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors">Facebook</a>
          )}
          {artist.links?.spotify && (
            <a href={artist.links.spotify} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors">Spotify</a>
          )}
          {artist.links?.website && (
            <a href={artist.links.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors">Website</a>
          )}
        </div>
      </div>

      {/* Card: Left image, right bio only */}
      <Card className="overflow-hidden border border-secondary/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6 p-0 md:p-6">
          {/* Left: Portrait */}
          <div className="relative md:col-span-1">
            <div className="relative w-full aspect-[9/16] md:aspect-[9/16]">
              {artist.photo ? (
                <Image 
                  src={artist.photo} 
                  alt={artist.name} 
                  fill 
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover" 
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-6xl">🎧</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Bio only */}
          <div className="md:col-span-2 p-6 pt-4 md:p-0 md:pr-0 md:py-0 flex flex-col gap-2 text-center md:text-left">
            {artist.bio && <H3 className="text-secondary">Bio</H3>}
            {Array.isArray(artist.bio) ? (
              <div className="mt-1 space-y-1">
                {artist.bio.map((para, i) => (
                  <div key={i} className="text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: para }} />
                ))}
              </div>
            ) : (
              artist.bio && (
                <div
                  className="text-foreground/90 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: artist.bio }}
                />
              )
            )}
          </div>
        </div>
      </Card>

      {artist.embeds?.soundcloud && artist.embeds.soundcloud.length > 0 && (
        <div className="w-full overflow-hidden rounded-md border border-secondary/30">
          <iframe
            title={`${artist.name} — SoundCloud`}
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(artist.embeds.soundcloud[0])}&color=%23bda64d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
          />
        </div>
      )}

      {(() => {
        const firstYoutube = artist.embeds?.youtube?.[0]
        const videoId = firstYoutube ? extractYouTubeId(firstYoutube) : null
        if (!videoId) return null
        return (
          <div className="w-full aspect-video overflow-hidden rounded-md border border-secondary/30">
            <iframe
              title={`${artist.name} — YouTube`}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        )
      })()}

      {artist.embeds?.spotify && artist.embeds.spotify.length > 0 && (
        <div className="w-full overflow-hidden rounded-md border border-secondary/30">
          <iframe
            title={`${artist.name} — Spotify`}
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            src={`https://open.spotify.com/embed/artist/${artist.embeds.spotify[0].split('/artist/')[1].split('?')[0]}`}
          />
        </div>
      )}
    </div>
  )
}
