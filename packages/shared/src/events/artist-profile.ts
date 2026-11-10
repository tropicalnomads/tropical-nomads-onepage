export function artistIdFromName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const stem = base === '' ? 'artist' : base;
  return stem.slice(0, 80);
}

export function soundCloudPlayerUrl(value: string): string | undefined {
  const text = value.trim();
  if (text === '') {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return undefined;
  }
  const host = url.hostname.toLowerCase();
  const soundCloud = host === 'soundcloud.com' || host === 'www.soundcloud.com' || host.endsWith('.soundcloud.com');
  if (url.protocol !== 'https:' || !soundCloud) {
    return undefined;
  }
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}&color=%232ee6d6`;
}

export function httpsProfileUrl(value: string, hostSuffix?: string): string | undefined {
  const text = value.trim();
  if (text === '') {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:' || text.length > 500) {
    return undefined;
  }
  if (hostSuffix) {
    const host = url.hostname.toLowerCase();
    const allowed = host === hostSuffix || host === `www.${hostSuffix}` || host.endsWith(`.${hostSuffix}`);
    if (!allowed) {
      return undefined;
    }
  }
  return url.toString();
}
