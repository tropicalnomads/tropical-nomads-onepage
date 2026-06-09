// Google Analytics (GA4) helper utilities
// Keep the measurement ID configurable via env with a hardcoded fallback provided by the user

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID || "G-GJ57HBKCTH";

export function isGaEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(GA_MEASUREMENT_ID);
}

export function pageview(url: string) {
  if (!isGaEnabled()) return;
  // gtag is injected by the loader component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtagFunc: any = (window as unknown as { gtag?: unknown }).gtag;
  if (typeof gtagFunc === "function") {
    gtagFunc("config", GA_MEASUREMENT_ID, {
      page_path: url,
      page_location: typeof window !== "undefined" ? window.location.href : undefined,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });
  }
}

export type GtagEventParams = Record<string, unknown>;

export function sendEvent(eventName: string, params?: GtagEventParams) {
  if (!isGaEnabled()) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtagFunc: any = (window as unknown as { gtag?: unknown }).gtag;
  if (typeof gtagFunc === "function") {
    gtagFunc("event", eventName, params || {});
  }
}


