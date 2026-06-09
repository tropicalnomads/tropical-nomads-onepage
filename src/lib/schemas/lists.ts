import { z } from "zod";
import { ArtistSchema } from "./artist";
import { EventSchema } from "./event";
import { PostSchema } from "./post";
import { FAQItemSchema } from "./faq";

export const artists = z.array(ArtistSchema);
export const events = z.array(EventSchema);
export const posts = z.array(PostSchema);
export const faq = z.array(FAQItemSchema);

