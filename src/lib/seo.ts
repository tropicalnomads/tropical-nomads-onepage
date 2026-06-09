import type { SEO } from "./types";

export function toNextMetadata(seo?: SEO): { title?: string; description?: string; openGraph?: { images?: string[] } } {
  if (!seo) return {};
  const { title, description, ogImage } = seo;
  return {
    title,
    description,
    openGraph: {
      images: ogImage ? [ogImage] : undefined
    }
  };
}

