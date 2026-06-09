import { z } from "zod";
import { SEOSchema } from "./seo";

export const EventLineupItemSchema = z.object({
  artistSlug: z.string(),
  headliner: z.boolean().optional(),
  order: z.number().optional()
}).strict();

export const EventScheduleItemSchema = z.object({
  stage: z.string(),
  start: z.string(),
  end: z.string(),
  artistSlug: z.string()
}).strict();

export const EventLinksSchema = z.object({
  ra: z.string().url().optional(),
  facebook: z.string().url().optional(),
  album: z.string().url().optional(),
  aftermovie: z.string().url().optional()
}).strict();

export const EventSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  city: z.string(),
  venue: z.string().optional(),
  poster: z.string().optional(),
  headliners: z.array(z.string()).optional(),
  stages: z.array(z.string()).optional(),
  lineup: z.array(EventLineupItemSchema).optional(),
  schedule: z.array(EventScheduleItemSchema).optional(),
  gallery: z.array(z.string()).optional(),
  heroImages: z.array(z.string()).optional(),
  links: EventLinksSchema.optional(),
  description: z.string().optional(),
  seo: SEOSchema.optional()
}).strict();

