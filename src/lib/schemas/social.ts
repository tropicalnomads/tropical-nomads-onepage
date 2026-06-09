import { z } from "zod";

export const SocialLinksSchema = z.object({
  instagram: z.string().url().optional(),
  instagram2: z.string().url().optional(),
  soundcloud: z.string().url().optional(),
  spotify: z.string().url().optional(),
  youtube: z.string().url().optional(),
  facebook: z.string().url().optional(),
  ra: z.string().url().optional(),
  website: z.string().url().optional()
}).strict();

