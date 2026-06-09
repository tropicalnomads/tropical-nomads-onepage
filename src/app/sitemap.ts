import type { MetadataRoute } from "next";
import { getEvents, listEditions } from "@/lib/party";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const eventItems = getEvents("events");
  const editionItems = listEditions("events");
  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${base}/about`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/events`, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/past`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/map`, changeFrequency: "monthly" as const, priority: 0.7 },
  ];

  // Event detail pages
  urls.push(
    ...eventItems.map((e) => ({
      url: `${base}/events/${e.slug}`,
      lastModified: e.startDate || e.endDate,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  );

  // Gallery edition pages
  urls.push(
    ...editionItems
      .filter((edition) => edition.id !== "3")
      .map((edition) => ({
        url: `${base}/past/${edition.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.5
      }))
  );

  return urls;
}


