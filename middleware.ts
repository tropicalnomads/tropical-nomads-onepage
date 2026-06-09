import { NextResponse, type NextRequest } from "next/server";

type SiteKey = "events" | "bookings";

function resolveSite(request: NextRequest): SiteKey {
  const querySite = request.nextUrl.searchParams.get("site");
  if (querySite === "events" || querySite === "bookings") {
    return querySite;
  }

  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (host.includes("bookings.") || host.includes("bookings.localhost")) {
    return "bookings";
  }

  if (host.includes("events.") || host.includes("events.localhost")) {
    return "events";
  }

  return "events";
}

function isRoutablePath(pathname: string): boolean {
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return false;
  }
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return false;
  }

  return !/\.[a-zA-Z0-9]+$/.test(pathname);
}

export function middleware(request: NextRequest) {
  if (!isRoutablePath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const site = resolveSite(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/events-site") || pathname.startsWith("/bookings-site")) {
    const response = NextResponse.next();
    response.headers.set("x-site", site);
    return response;
  }

  const targetPath = pathname === "/" ? `/${site}-site` : `/${site}-site${pathname}`;
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = targetPath;

  const response = NextResponse.rewrite(rewriteUrl);
  response.headers.set("x-site", site);
  return response;
}

export const config = {
  matcher: ["/:path*"],
};

