import { z } from "zod";
import { SocialLinksSchema } from "./social";
import { SEOSchema } from "./seo";

export const PartyConfigSchema = z.object({
  key: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  tagline: z.string().optional(),
  city: z.string().optional(),
  date: z.string().optional(),
  venue: z.string().optional(),
  colors: z.object({ bg: z.string(), fg: z.string(), accent: z.string() }).strict().optional(),
  socials: SocialLinksSchema.optional(),
  seo: SEOSchema.optional()
}).strict();