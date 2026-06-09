import Image from "next/image"
import { getArtists } from "@/lib/party"
import { Card } from "@/components/ui/card"

export default function Lineup() {
  const artists = getArtists()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))

  if (artists.length === 0) {
    return (
      <div className="w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary">Lineup</h1>
          <p className="text-muted-foreground">Lineup a ser anunciado</p>
        </div>
      </div>
    )
  }
    
  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary">Lineup</h1>
        <p className="text-muted-foreground">Conheça os artistas confirmados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {artists.map((a) => (
          <a key={a.slug} href={`/lineup/${a.slug}`} className="block group">
            <Card className="overflow-hidden border border-secondary/30 p-0">
              <div className="relative aspect-[9/16]">
                {a.photo ? (
                  <Image
                    src={a.photo}
                    alt={a.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-4xl">🎧</span>
                  </div>
                )}
                {/* Dark bottom gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />
                {/* Bottom overlay with name and agency (approx 15% height) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col justify-end" style={{ height: '15%' }}>
                  <div className="text-white text-base md:text-lg font-semibold leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                    {a.name}
                  </div>
                  {a.agency && (
                    <div className="text-[11px] md:text-xs text-white/80 mt-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                      {a.agency}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
