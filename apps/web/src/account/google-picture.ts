import { avatarByteLimit } from 'tropical-nomads-shared';
import { inspectAvatar } from 'tropical-nomads-api/accounts';

const pictureUrlLimit = 2048;

function googleHost(host: string, suffix: 'googleusercontent.com' | 'ggpht.com'): boolean {
  return host === suffix || host.endsWith(`.${suffix}`);
}

function httpsPictureUrl(value: string, base?: string): URL | undefined {
  let url: URL;
  try {
    url = new URL(value.trim(), base);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '' || url.port !== '' || url.toString().length > pictureUrlLimit) {
    return undefined;
  }
  return url;
}

export function googlePictureUrl(value: string): string | undefined {
  const url = httpsPictureUrl(value);
  if (!url || !googleHost(url.hostname.toLowerCase(), 'googleusercontent.com')) {
    return undefined;
  }
  return url.toString();
}

function googlePictureRedirect(value: string, base: string): string | undefined {
  if (value.trim() === '') {
    return undefined;
  }
  const url = httpsPictureUrl(value, base);
  if (!url) {
    return undefined;
  }
  const host = url.hostname.toLowerCase();
  if (!googleHost(host, 'googleusercontent.com') && !googleHost(host, 'ggpht.com')) {
    return undefined;
  }
  return url.toString();
}

export async function readGooglePicture(value: string, fetchImpl: typeof fetch = fetch): Promise<Uint8Array | undefined> {
  const first = googlePictureUrl(value);
  if (!first) {
    return undefined;
  }
  try {
    const response = await fetchImpl(first, { redirect: 'manual', signal: AbortSignal.timeout(4000) });
    if (response.status >= 300 && response.status < 400) {
      const next = googlePictureRedirect(response.headers.get('location') ?? '', first);
      if (!next) {
        return undefined;
      }
      return pictureBytes(await fetchImpl(next, { redirect: 'error', signal: AbortSignal.timeout(4000) }));
    }
    return pictureBytes(response);
  } catch {
    return undefined;
  }
}

async function pictureBytes(response: Response): Promise<Uint8Array | undefined> {
  if (!response.ok) {
    return undefined;
  }
  const advertised = Number(response.headers.get('content-length') ?? '0');
  if (Number.isFinite(advertised) && advertised > avatarByteLimit) {
    return undefined;
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return inspectAvatar(bytes) ? bytes : undefined;
}
