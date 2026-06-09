import fs from "node:fs";
import path from "node:path";
// import { PartyConfigSchema } from "./schemas/party";
// import * as Collections from "./schemas/lists";
import type {
  Artist,
  EditionIndexItem,
  EditionMeta,
  EventDetail,
  FAQItem,
  PartyConfig,
  Post,
} from "./types";

export type GeneralConfig = {
  ticketsComingSoon?: boolean;
  tickets: { url?: string; label: string };
  socials: { instagram?: string; instagram2?: string; goabase?: string; ra?: string };
};

const PARTY_KEY = process.env.PARTY_KEY || "forest-shankara";
const base = path.join(process.cwd(), "src", "data", PARTY_KEY);
const editionsBase = path.join(base, "editions");

function loadJSON<T>(file: string): T {
  const full = path.join(base, file);
  return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
}

function loadEditionJSONOrFallback<T>(editionId: string, file: string, fallback: T): T {
  const full = path.join(editionsBase, editionId, file);
  if (!fs.existsSync(full)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
}

export function getPartyValidated(): PartyConfig {
  const data = loadJSON<unknown>("config.json");
  // return PartyConfigSchema.parse(data);
  return data as PartyConfig;
}

export function getArtistsValidated(): Artist[] {
  const data = loadJSON<unknown>("artists.json");
  // return Collections.artists.parse(data);
  return data as Artist[];
}

export function getEventsValidated(): EventDetail[] {
  const data = loadJSON<unknown>("events.json");
  // return Collections.events.parse(data) as EventDetail[];
  return data as EventDetail[];
}

export function getPostsValidated(): Post[] {
  const data = loadJSON<unknown>("posts.json");
  // return Collections.posts.parse(data);
  return data as Post[];
}

export function getFAQValidated(): FAQItem[] {
  const data = loadJSON<unknown>("faq.json");
  // return Collections.faq.parse(data);
  return data as FAQItem[];
}

export function getGeneralValidated(): GeneralConfig {
  const data = loadJSON<unknown>("general.json");
  return data as GeneralConfig;
}

export function listEditionsValidated(): EditionIndexItem[] {
  const data = loadJSON<unknown>("editions/index.json");
  return data as EditionIndexItem[];
}

export function getEditionMetaValidated(editionId: string): EditionMeta | null {
  return loadEditionJSONOrFallback<EditionMeta | null>(editionId, "meta.json", null);
}

export function getEditionGalleryValidated(editionId: string): string[] {
  return loadEditionJSONOrFallback<string[]>(editionId, "gallery.json", []);
}

export function getEditionArtistsValidated(editionId: string): Artist[] {
  return loadEditionJSONOrFallback<Artist[]>(editionId, "artists.json", []);
}

export function getEditionPostsValidated(editionId: string): Post[] {
  return loadEditionJSONOrFallback<Post[]>(editionId, "posts.json", []);
}

export function getEditionEventsValidated(editionId: string): EventDetail[] {
  return loadEditionJSONOrFallback<EventDetail[]>(editionId, "events.json", []);
}

// Slug helpers
export const listArtistSlugs = (): string[] => getArtistsValidated().map(a => a.slug);
export const listEventSlugs = (): string[] => getEventsValidated().map(e => e.slug);
export const listPostSlugs = (): string[] => getPostsValidated().map(p => p.slug);

export const getArtistBySlug = (slug: string): Artist | undefined =>
  getArtistsValidated().find(a => a.slug === slug);

export const getEventBySlug = (slug: string): EventDetail | undefined =>
  getEventsValidated().find(e => e.slug === slug);

export const getPostBySlug = (slug: string): Post | undefined =>
  getPostsValidated().find(p => p.slug === slug);

