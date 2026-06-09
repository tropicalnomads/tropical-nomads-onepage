import type { SocialLinks } from "./social";

export type ArtistRole = 'DJ' | 'Live' | 'VJ';

export type ArtistTag =
  | 'Full-on'
  | 'Twilight'
  | 'Forest'
  | 'Hitech'
  | 'Dark'
  | 'Prog'
  | (string & {});

export type ArtistEmbeds = { soundcloud?: string[]; spotify?: string[]; youtube?: string[] };

export type Artist = {
  slug: string;
  name: string;
  role: ArtistRole;
  tags: ArtistTag[];
  genres?: string[];
  country?: string;
  photo?: string;
  bio?: string | string[];
  agency?: string;
  availableForBooking?: boolean;
  pressKit?: string;
  fee?: string;
  links?: SocialLinks;
  embeds?: ArtistEmbeds;
};

