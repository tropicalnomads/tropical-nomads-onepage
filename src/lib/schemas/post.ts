import { z } from "zod";

export const PostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  publishedAt: z.string(),
  images: z.array(z.string()).optional(),
  body: z.string().optional(),
  source: z.enum(["Instagram","Manual"]).optional(),
  igPostUrl: z.string().url().optional()
}).strict();

