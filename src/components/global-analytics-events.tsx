"use client";

import { useEffect } from "react";
import { sendEvent } from "@/lib/gtag";

export function GlobalAnalyticsEvents() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>("[data-ga-event]");
      if (!el) return;

      const eventName = el.getAttribute("data-ga-event") || "click";
      const eventId = el.getAttribute("data-ga-id") || undefined;
      const eventLabel = el.getAttribute("data-ga-label") || el.textContent || undefined;
      const eventSection = el.getAttribute("data-ga-section") || undefined;
      const href = (el as HTMLAnchorElement).href || undefined;

      sendEvent(eventName, {
        event_id: eventId,
        event_label: eventLabel?.trim(),
        event_section: eventSection,
        href,
        page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
      });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}


