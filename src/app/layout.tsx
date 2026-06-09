import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GoogleAnalytics } from "@/components/google-analytics";
import { Suspense } from "react";
import { GlobalAnalyticsEvents } from "@/components/global-analytics-events";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: typeof window === "undefined" && process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: "Tropical Nomads",
    template: "%s | Tropical Nomads",
  },
  description: "Events and artist bookings across Europe by Tropical Nomads.",
  applicationName: "Tropical Nomads",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Tropical Nomads",
    title: "Tropical Nomads",
    description: "Events and artist bookings across Europe by Tropical Nomads.",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tropical Nomads",
    description: "Events and artist bookings across Europe by Tropical Nomads.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

import type { Viewport } from "next";
export const viewport: Viewport = {
  themeColor: "#0d1b2a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <GlobalAnalyticsEvents />
        <main className="flex-1">
          {children}
        </main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
