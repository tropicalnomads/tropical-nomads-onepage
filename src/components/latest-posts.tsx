"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";

interface Post {
  slug: string;
  title: string;
  publishedAt: string;
  images?: string[];
  source?: string;
  igPostUrl?: string;
}

interface LatestPostsProps {
  allPosts: Post[];
}

export function LatestPosts({ allPosts }: LatestPostsProps) {
  if (allPosts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold">Últimas Notícias</h2>
        <p className="text-muted-foreground">
          Mantenha-se conectado com as últimas notícias e atualizações da Forest Shankara
        </p>
      </div>
      
      <div className="relative max-w-[80%] mx-auto md:max-w-4xl lg:max-w-6xl px-2 md:px-10 lg:px-8 xl:px-0" >
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {allPosts.map((post) => (
              <CarouselItem key={post.slug} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg border border-secondary/20 p-0">
                  <a href={post.igPostUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <div className="aspect-[9/16] relative overflow-hidden">
                      {post.images && post.images.length > 0 ? (
                        <Image
                          src={post.images[0]}
                          alt={post.title}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-4xl">🌲</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 text-center">
                      <h3
                        className="font-semibold line-clamp-2 mb-2 group-hover:text-secondary transition-colors"
                        style={{ fontFamily: 'system-ui, "Segoe UI", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
                      >
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </CardContent>
                  </a>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
