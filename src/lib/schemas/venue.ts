import { z } from "zod";

export const VenueSchema = z.object({
  city: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  status: z.enum(["past", "upcoming"]),
  count: z.number().optional(),
  events: z.array(z.string()).optional(),
}).strict();

