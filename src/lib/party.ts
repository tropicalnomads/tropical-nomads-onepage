import type { PartyConfig, Artist, EditionIndexItem, EditionMeta, EventDetail, Post, FAQItem } from "./types";
import {
  getPartyValidated,
  getArtistsValidated,
  getEventsValidated,
  getPostsValidated,
  getFAQValidated,
  getGeneralValidated,
  getEditionArtistsValidated,
  getEditionEventsValidated,
  getEditionGalleryValidated,
  getEditionMetaValidated,
  getEditionPostsValidated,
  listEditionsValidated,
  getVenuesValidated,
  type VenuePoint,
} from "./content";
import type { SiteKey } from "./site";

const DEFAULT_SITE: SiteKey = "events";

export function getParty(site: SiteKey = DEFAULT_SITE): PartyConfig { return getPartyValidated(site); }
export function getArtists(site: SiteKey = DEFAULT_SITE): Artist[] { return getArtistsValidated(site); }
export function getEvents(site: SiteKey = DEFAULT_SITE): EventDetail[] { return getEventsValidated(site); }
export function getPosts(site: SiteKey = DEFAULT_SITE): Post[] { return getPostsValidated(site); }
export function getFAQ(site: SiteKey = DEFAULT_SITE): FAQItem[] { return getFAQValidated(site); }
export function getGeneral(site: SiteKey = DEFAULT_SITE) { return getGeneralValidated(site); }
export function getVenues(site: SiteKey = DEFAULT_SITE): VenuePoint[] { return getVenuesValidated(site); }
export function listEditions(site: SiteKey = DEFAULT_SITE): EditionIndexItem[] { return listEditionsValidated(site); }
export function getEditionMeta(site: SiteKey, editionId: string): EditionMeta | null { return getEditionMetaValidated(site, editionId); }
export function getEditionGallery(site: SiteKey, editionId: string) { return getEditionGalleryValidated(site, editionId); }
export function getEditionArtists(site: SiteKey, editionId: string): Artist[] { return getEditionArtistsValidated(site, editionId); }
export function getEditionPosts(site: SiteKey, editionId: string): Post[] { return getEditionPostsValidated(site, editionId); }
export function getEditionEvents(site: SiteKey, editionId: string): EventDetail[] { return getEditionEventsValidated(site, editionId); }
