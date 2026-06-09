import type { SEO } from "./seo";

export type EventLinks = { ra?: string; facebook?: string; album?: string; aftermovie?: string };
export type EventLineupItem = { artistSlug: string; headliner?: boolean; order?: number };
export type EventScheduleItem = { stage: string; start: string; end: string; artistSlug: string };

export type EventRef = {
  slug: string;
  title: string;
  startDate: string;
  endDate?: string;
  city: string;
  venue?: string;
  poster?: string;
  headliners?: string[];
};

export type EventDetail = EventRef & {
  stages?: string[];
  lineup?: EventLineupItem[];
  schedule?: EventScheduleItem[];
  gallery?: string[];
  heroImages?: string[];
  links?: EventLinks;
  description?: string;
  seo?: SEO;
};

