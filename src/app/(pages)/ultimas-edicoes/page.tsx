import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { listEditions, getEditionMeta } from "@/lib/party";

export default function LatestEditionsPage() {
  const editions = listEditions().filter((edition) => edition.id !== "3");

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary">Últimas edições</h1>
        <p className="text-muted-foreground">Explore fotos, vídeos e sets das edições anteriores</p>
      </div>

      <div className="flex flex-wrap gap-6 justify-center">
        {editions.map((edition) => {
          const meta = getEditionMeta(edition.id);
          return (
            <Link key={edition.id} href={`/ultimas-edicoes/${edition.id}`} className="block w-full max-w-[320px]">
              <Card className="h-full border border-secondary/30 transition-colors hover:border-secondary/70">
                <div className="relative aspect-[9/16] overflow-hidden rounded-t-lg bg-primary/10">
                  {meta?.mainArt ? (
                    <Image
                      src={meta.mainArt}
                      alt={`Arte principal — ${edition.title}`}
                      fill
                      sizes="(max-width: 768px) 85vw, 320px"
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Arte principal em atualização
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-center">{edition.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
