/** Public origin of the API, when a working URL has been configured. */
export function apiOrigin(env: Record<string, string | undefined> = process.env): string | undefined {
  const raw = env.API_BASE_URL?.trim() ?? '';
  if (raw === '') {
    return undefined;
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return undefined;
    }
    return url.origin;
  } catch {
    return undefined;
  }
}
