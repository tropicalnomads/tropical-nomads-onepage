import { headers } from "next/headers";
import { redirect } from "next/navigation";

function resolveSiteFromHost(host: string): "events" | "bookings" {
  const normalized = host.toLowerCase();
  if (normalized.includes("bookings.") || normalized.includes("bookings.localhost")) {
    return "bookings";
  }
  return "events";
}

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedSite = params.site;
  if (requestedSite === "events" || requestedSite === "bookings") {
    redirect(`/${requestedSite}-site`);
  }

  const h = await headers();
  const host = h.get("host") ?? "";
  const site = resolveSiteFromHost(host);
  redirect(`/${site}-site`);
}

