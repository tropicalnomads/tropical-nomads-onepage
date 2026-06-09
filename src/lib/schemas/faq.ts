import { z } from "zod";

export const FAQItemSchema = z.object({
  category: z.string(),
  question: z.string(),
  answer: z.string()
}).strict();

