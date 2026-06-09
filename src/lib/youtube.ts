// Extracts a YouTube video ID from various URL formats, or returns the input if it already looks like an ID.
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  // If it looks like a raw 11-char ID (letters, digits, - or _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    // youtu.be/<id>
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    // youtube.com or m.youtube.com
    if (url.hostname.includes("youtube.com")) {
      // Short format: /shorts/<id>
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }

      // Embed format: /embed/<id>
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }

      // Watch format: ?v=<id>
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }
  } catch {
    // Not a URL, fall through
  }

  return null;
}


