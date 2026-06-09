import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import * as Collections from "./schemas/lists";
import { PartyConfigSchema } from "./schemas/party";
import type {
  Artist,
  EditionIndexItem,
  EditionMeta,
  EventDetail,
  FAQItem,
  PartyConfig,
  Post,
} from "./types";
import type { SiteKey } from "./site";

export type GeneralConfig = {
  ticketsComingSoon?: boolean;
  tickets: { url?: string; label: string };
  socials: { instagram?: string; instagram2?: string; goabase?: string; ra?: string };
};

export type VenuePoint = {
  city: string;
  country: string;
  lat: number;
  lng: number;
  status: "past" | "upcoming";
  count?: number;
  events?: string[];
};

const GeneralConfigSchema = z.object({
  ticketsComingSoon: z.boolean().optional(),
  tickets: z.object({
    url: z.string().url().optional(),
    label: z.string(),
  }),
  socials: z.object({
    instagram: z.string().url().optional(),
    instagram2: z.string().url().optional(),
    goabase: z.string().url().optional(),
    ra: z.string().url().optional(),
  }),
});

const EditionMetaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  shortLabel: z.string(),
  year: z.number().optional(),
  city: z.string().optional(),
  dateLabel: z.string().optional(),
  description: z.string().optional(),
  mainArt: z.string().optional(),
  youtube: z.array(z.object({ title: z.string(), url: z.string().url() })).optional(),
  soundcloud: z.array(z.object({ title: z.string(), url: z.string().url() })).optional(),
  videos: z.array(z.object({ title: z.string(), url: z.string().url(), type: z.enum(["youtube", "vimeo", "mp4"]).optional() })).optional(),
});

const EditionIndexSchema = z.array(
  z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    shortLabel: z.string(),
    year: z.number().optional(),
    galleryReady: z.boolean().optional(),
  }),
);

const GalleryEntrySchema = z.object({
  images: z.array(z.string()).default([]),
  videos: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      type: z.enum(["youtube", "vimeo", "mp4"]).optional(),
      poster: z.string().optional(),
    }),
  ).default([]),
});

const VenuePointSchema = z.array(
  z.object({
    city: z.string(),
    country: z.string(),
    lat: z.number(),
    lng: z.number(),
    status: z.enum(["past", "upcoming"]),
    count: z.number().optional(),
    events: z.array(z.string()).optional(),
  }),
);

function siteBase(site: SiteKey): string {
  return path.join(process.cwd(), "src", "data", site);
}

function editionsBase(site: SiteKey): string {
  return path.join(siteBase(site), "editions");
}

function loadJSON<T>(site: SiteKey, file: string): T {
  const full = path.join(siteBase(site), file);
  return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
}

function loadEditionJSONOrFallback<T>(site: SiteKey, editionId: string, file: string, fallback: T): T {
  const full = path.join(editionsBase(site), editionId, file);
  if (!fs.existsSync(full)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
}

export function getPartyValidated(site: SiteKey): PartyConfig {
  return PartyConfigSchema.parse(loadJSON<unknown>(site, "config.json"));
}

export function getArtistsValidated(site: SiteKey): Artist[] {
  return Collections.artists.parse(loadJSON<unknown>(site, "artists.json"));
}

export function getEventsValidated(site: SiteKey): EventDetail[] {
  return Collections.events.parse(loadJSON<unknown>(site, "events.json")) as EventDetail[];
}

export function getPostsValidated(site: SiteKey): Post[] {
  try {
    return Collections.posts.parse(loadJSON<unknown>(site, "posts.json"));
  } catch {
    return [];
  }
}

export function getFAQValidated(site: SiteKey): FAQItem[] {
  try {
    return Collections.faq.parse(loadJSON<unknown>(site, "faq.json"));
  } catch {
    return [];
  }
}

export function getGeneralValidated(site: SiteKey): GeneralConfig {
  return GeneralConfigSchema.parse(loadJSON<unknown>(site, "general.json"));
}

export function getVenuesValidated(site: SiteKey): VenuePoint[] {
  return VenuePointSchema.parse(loadJSON<unknown>(site, "venues.json"));
}

export function listEditionsValidated(site: SiteKey): EditionIndexItem[] {
  return EditionIndexSchema.parse(loadJSON<unknown>(site, "editions/index.json"));
}

export function getEditionMetaValidated(site: SiteKey, editionId: string): EditionMeta | null {
  const raw = loadEditionJSONOrFallback<unknown | null>(site, editionId, "meta.json", null);
  return raw ? EditionMetaSchema.parse(raw) : null;
}

export function getEditionGalleryValidated(site: SiteKey, editionId: string): { images: string[]; videos: { title: string; url: string; type?: "youtube" | "vimeo" | "mp4"; poster?: string }[] } {
  const raw = loadEditionJSONOrFallback<unknown>(site, editionId, "gallery.json", { images: [], videos: [] });
  return GalleryEntrySchema.parse(raw);
}

export function getEditionArtistsValidated(site: SiteKey, editionId: string): Artist[] {
  return loadEditionJSONOrFallback<Artist[]>(site, editionId, "artists.json", []);
}

export function getEditionPostsValidated(site: SiteKey, editionId: string): Post[] {
  return loadEditionJSONOrFallback<Post[]>(site, editionId, "posts.json", []);
}

export function getEditionEventsValidated(site: SiteKey, editionId: string): EventDetail[] {
  return loadEditionJSONOrFallback<EventDetail[]>(site, editionId, "events.json", []);
}

export const listArtistSlugs = (site: SiteKey): string[] => getArtistsValidated(site).map((a) => a.slug);
export const listEventSlugs = (site: SiteKey): string[] => getEventsValidated(site).map((e) => e.slug);
export const listPostSlugs = (site: SiteKey): string[] => getPostsValidated(site).map((p) => p.slug);

export const getArtistBySlug = (site: SiteKey, slug: string): Artist | undefined =>
  getArtistsValidated(site).find((a) => a.slug === slug);

export const getEventBySlug = (site: SiteKey, slug: string): EventDetail | undefined =>
  getEventsValidated(site).find((e) => e.slug === slug);

export const getPostBySlug = (site: SiteKey, slug: string): Post | undefined =>
  getPostsValidated(site).find((p) => p.slug === slug);

