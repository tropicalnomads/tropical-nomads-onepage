function configuredApiBaseUrl(env: Record<string, string | undefined> | undefined): string {
  if (env !== undefined && env !== process.env) {
    return env.API_BASE_URL?.trim() ?? '';
  }
  return process.env.API_BASE_URL?.trim() ?? '';
}

/** Public origin of the API, when a working URL has been configured. */
export function apiOrigin(env?: Record<string, string | undefined>): string | undefined {
  const raw = configuredApiBaseUrl(env);
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
