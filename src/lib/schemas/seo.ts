import { z } from "zod";

export const SEOSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: z.string().optional()
}).strict();

