"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EditionGalleryLoadMoreProps = {
  gallery: string[];
  editionTitle: string;
};

const BATCH_SIZE = 24;

export function EditionGalleryLoadMore({ gallery, editionTitle }: EditionGalleryLoadMoreProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const visiblePhotos = gallery.slice(0, visibleCount);
  const hasMore = visibleCount < gallery.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visiblePhotos.map((imagePath, index) => (
          <Card key={`${imagePath}-${index}`} className="overflow-hidden border border-secondary/30 p-0">
            <div className="relative aspect-square">
              <Image
                src={imagePath}
                alt={`${editionTitle} — imagem ${index + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Mostrando {visiblePhotos.length} de {gallery.length} fotos
        </p>
        {hasMore ? (
          <Button
            variant="outline"
            onClick={() => setVisibleCount((current) => Math.min(current + BATCH_SIZE, gallery.length))}
          >
            Carregar mais fotos
          </Button>
        ) : null}
      </div>
    </div>
  );
}
