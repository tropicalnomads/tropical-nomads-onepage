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
} from "./content";

export function getParty(): PartyConfig { return getPartyValidated(); }
export function getArtists(): Artist[] { return getArtistsValidated(); }
export function getEvents(): EventDetail[] { return getEventsValidated(); }
export function getPosts(): Post[] { return getPostsValidated(); }
export function getFAQ(): FAQItem[] { return getFAQValidated(); }
export function getGeneral() { return getGeneralValidated(); }
export function listEditions(): EditionIndexItem[] { return listEditionsValidated(); }
export function getEditionMeta(editionId: string): EditionMeta | null { return getEditionMetaValidated(editionId); }
export function getEditionGallery(editionId: string): string[] { return getEditionGalleryValidated(editionId); }
export function getEditionArtists(editionId: string): Artist[] { return getEditionArtistsValidated(editionId); }
export function getEditionPosts(editionId: string): Post[] { return getEditionPostsValidated(editionId); }
export function getEditionEvents(editionId: string): EventDetail[] { return getEditionEventsValidated(editionId); }
