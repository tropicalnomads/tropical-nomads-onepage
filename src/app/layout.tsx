import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@/components/google-analytics";
import { EventJsonLd } from "@/components/jsonld-event";
import { Suspense } from "react";
import { GlobalAnalyticsEvents } from "@/components/global-analytics-events";
import type { Metadata } from "next";
import config from "@/data/forest-shankara/config.json";

const fallbackDescription = `${config.name} — ${config.tagline || "Sacred Pulse"} em ${config.city}. Novidades em breve.`;
const metadataDescription = config.seo?.description || fallbackDescription;
const socialImage = config.seo?.ogImage || config.banner || "/forest-shankara/banner.jpg";

export const metadata: Metadata = {
  metadataBase: typeof window === "undefined" && process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: config.seo?.title || "Forest Shankara",
    template: "%s | Forest Shankara"
  },
  description: metadataDescription,
  applicationName: config.name,
  keywords: [
    "Psytrance",
    "Fullon",
    "Forest",
    "Darkpsy",
    "Sacred Pulse",
    config.city,
    "Forest",
    "Shankara",
    "Música Eletrônica",
    "Forest Shankara",
    "Florianópolis",
    "Festival",
  ],
  authors: [{ name: config.name }],
  creator: config.name,
  publisher: config.name,
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: "website",
    siteName: config.name,
    title: config.seo?.title || config.name,
    description: metadataDescription,
    locale: "pt_BR",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: config.seo?.title || config.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: config.seo?.title || config.name,
    description: metadataDescription,
    images: [socialImage]
  },
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/forest-shankara/logo.png"
  }
};

import type { Viewport } from "next";
export const viewport: Viewport = {
  themeColor: config.colors?.bg || "#0f172a"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <GlobalAnalyticsEvents />
        <EventJsonLd />
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
        <SiteFooter />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
