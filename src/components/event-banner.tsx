"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { PartyConfig } from "@/lib/types";
import { Ticket, Instagram } from "lucide-react";

interface EventBannerProps {
  config: PartyConfig;
  general: {
    ticketsComingSoon?: boolean;
    tickets: {
      url?: string;
      label: string;
    };
  };
}

export function EventBanner({ config, general }: EventBannerProps) {
  const cfg = config;
  const hasTicketUrl = typeof general.tickets?.url === "string" && general.tickets.url.length > 0;
  const showTicketsSoon = general.ticketsComingSoon || !hasTicketUrl;
  
  const bannerSrc = (typeof cfg.banner === 'string' && /\.(png|jpe?g|webp|avif|svg)$/i.test(cfg.banner))
    ? cfg.banner
    : "/events/hero.svg";
  
  const mobileBannerSrc = bannerSrc;

  return (
    <section className="relative w-full">
      {/* Banner Image */}
      <div className="relative aspect-square md:aspect-[16/9] w-full overflow-hidden rounded-lg border border-secondary/30">
        {/* Desktop Banner */}
        <Image
          src={bannerSrc}
          alt={`${cfg.name} - ${cfg.tagline}`}
          fill
          priority
          sizes="(max-width: 1312px) calc(100vw - 2rem), 1280px"
          className="object-cover hidden md:block"
        />
        {/* Mobile Banner */}
        <Image
          src={mobileBannerSrc}
          alt={`${cfg.name} - ${cfg.tagline}`}
          fill
          priority
          sizes="(max-width: 1312px) calc(100vw - 2rem), 1280px"
          className="object-cover md:hidden"
        />
      </div>

      {/* CTA buttons below banner */}
      <div className="p-6 md:p-8 text-center">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          {showTicketsSoon ? (
            <Button
              size="lg"
              variant="secondary"
              disabled
              className="w-full max-w-xs"
            >
              <Ticket className="mr-2" />
              {general.tickets.label}
            </Button>
          ) : (
            <Button
              size="lg"
              asChild
              className="w-full max-w-xs"
            >
              <a href={general.tickets.url} target="_blank" rel="noopener noreferrer" data-ga-event="click_ticket_cta" data-ga-id="banner_tickets" data-ga-section="banner">
                <Ticket className="mr-2" />
                {general.tickets.label}
              </a>
            </Button>
          )}
          <Button
            variant="secondary"
            size="lg"
            className="w-full max-w-xs"
            onClick={() => {
              if (cfg.socials?.instagram) {
                window.open(cfg.socials.instagram, '_blank', 'noopener,noreferrer');
              }
              if (cfg.socials?.instagram2) {
                window.open(cfg.socials.instagram2, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <Instagram className="mr-2" />
            Follow on Instagram
          </Button>
        </div>
      </div>
    </section>
  );
}
