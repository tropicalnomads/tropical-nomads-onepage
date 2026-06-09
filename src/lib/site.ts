import { headers } from "next/headers";

export type SiteKey = "events" | "bookings";

const EVENTS_HOST_HINTS = ["events.", "events.localhost"];
const BOOKINGS_HOST_HINTS = ["bookings.", "bookings.localhost"];

function siteFromHost(host: string): SiteKey {
  const normalized = host.toLowerCase();

  if (BOOKINGS_HOST_HINTS.some((hint) => normalized.includes(hint))) {
    return "bookings";
  }

  if (EVENTS_HOST_HINTS.some((hint) => normalized.includes(hint))) {
    return "events";
  }

  return "events";
}

export async function detectSiteFromHeaders(): Promise<SiteKey> {
  const h = await headers();
  const rewrittenSite = h.get("x-site");
  if (rewrittenSite === "events" || rewrittenSite === "bookings") {
    return rewrittenSite;
  }

  const host = h.get("host");
  if (!host) {
    return "events";
  }

  return siteFromHost(host);
}

