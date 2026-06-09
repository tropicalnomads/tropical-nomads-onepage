import { z } from "zod";
import { SocialLinksSchema } from "./social";

export const ArtistSchema = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.enum(["DJ","Live","VJ"]),
  tags: z.array(z.string()),
  country: z.string().optional(),
  photo: z.string().optional(),
  bio: z.union([z.string(), z.array(z.string())]).optional(),
  agency: z.string().optional(),
  links: SocialLinksSchema.optional(),
  embeds: z.object({
    soundcloud: z.array(z.string().url()).optional(),
    spotify: z.array(z.string()).optional(),
    youtube: z.array(z.string().url()).optional()
  }).strict().optional()
}).strict();

