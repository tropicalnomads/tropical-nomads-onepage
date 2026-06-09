import type { MetadataRoute } from "next";
import events from "@/data/forest-shankara/events.json";
import editions from "@/data/forest-shankara/editions/index.json";
import type { EditionIndexItem, EventDetail } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const allEvents = events as EventDetail[];
  const allEditions = editions as EditionIndexItem[];
  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${base}/about`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/events`, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/lineup`, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/ultimas-edicoes`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/faq`, changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  // Event detail pages
  urls.push(
    ...allEvents.map((e) => ({
      url: `${base}/events/${e.slug}`,
      lastModified: e.startDate,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  );

  // Gallery edition pages
  urls.push(
    ...allEditions
      .filter((edition) => edition.id !== "3")
      .map((edition) => ({
        url: `${base}/ultimas-edicoes/${edition.id}`,
        changeFrequency: "monthly" as const,
        priority: 0.5
      }))
  );

  return urls;
}


