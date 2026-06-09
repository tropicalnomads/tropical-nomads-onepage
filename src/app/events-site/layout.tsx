import { EventJsonLd } from "@/components/jsonld-event";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getParty } from "@/lib/party";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  const config = getParty("events");
  const title = config.seo?.title || config.name;
  const description = config.seo?.description || config.tagline || "Tropical Nomads events across Europe.";
  const socialImage = config.seo?.ogImage || config.banner || "/events/hero.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [socialImage],
      locale: "en",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default async function EventsSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EventJsonLd site="events" />
      <SiteHeader site="events" />
      <main className="container mx-auto max-w-7xl px-4 py-8">{children}</main>
      <SiteFooter site="events" />
    </>
  );
}

