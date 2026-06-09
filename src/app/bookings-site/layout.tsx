import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getParty } from "@/lib/party";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  const config = getParty("bookings");
  const title = config.seo?.title || config.name;
  const description = config.seo?.description || config.tagline || "Book Tropical Nomads artists across Europe.";
  const socialImage = config.seo?.ogImage || config.banner || "/bookings/hero.jpg";

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

export default async function BookingsSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader site="bookings" />
      <main className="container mx-auto max-w-7xl px-4 py-8">{children}</main>
      <SiteFooter site="bookings" />
    </>
  );
}

