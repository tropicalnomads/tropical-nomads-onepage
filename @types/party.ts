import type { SEO } from "./seo";
import type { SocialLinks } from "./social";

export type PartyConfig = {
  key: string;
  name: string;
  logo?: string;
  banner?: string;
  tagline?: string;
  city?: string;
  date?: string;
  endDate?: string;
  venue?: string;
  venue_link?: string;
  colors?: { bg: string; fg: string; accent: string };
  socials?: SocialLinks;
  seo?: SEO;
  tickets?: { url: string; label: string };
};

