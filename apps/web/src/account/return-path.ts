const blockedPaths = new Set([
  '/account/sign-in',
  '/account/register',
  '/account/confirm',
  '/account/forgot-password',
  '/account/profile',
  '/account/callback',
]);

const returnOrigin = 'https://return.invalid';

export type AuthScreen = '/account/sign-in' | '/account/register' | '/account/confirm' | '/account/forgot-password';

export function safeReturnPath(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 512) {
    return undefined;
  }
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return undefined;
  }
  if (trimmed.includes('\\') || trimmed.includes('://') || /[\u0000-\u001f\u007f\s]/.test(trimmed) || /%(?:2f|5c)/i.test(trimmed)) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(trimmed, returnOrigin);
  } catch {
    return undefined;
  }
  if (url.origin !== returnOrigin || url.username !== '' || url.password !== '') {
    return undefined;
  }
  const path = url.pathname;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || blockedPaths.has(path)) {
    return undefined;
  }
  return `${path}${url.search}`;
}

export function chooseReturnPath(preferred: string | null | undefined, stored: string | null | undefined): string {
  return safeReturnPath(preferred) ?? safeReturnPath(stored) ?? '/';
}

export function authPath(path: AuthScreen, next: string | null | undefined, extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      params.set(key, value);
    }
  }
  const safe = safeReturnPath(next);
  if (safe) {
    params.set('next', safe);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function pathToReturn(value: string | null | undefined): string | undefined {
  const direct = safeReturnPath(value);
  if (direct) {
    return direct;
  }
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) {
    return undefined;
  }
  try {
    const url = new URL(value, returnOrigin);
    if (url.origin !== returnOrigin) {
      return undefined;
    }
    return safeReturnPath(url.searchParams.get('next'));
  } catch {
    return undefined;
  }
}

export function signInHref(next: string | null | undefined): string {
  return authPath('/account/sign-in', pathToReturn(next));
}

export function profileSetupHref(next: string | null | undefined): string {
  const safe = safeReturnPath(next);
  return safe ? `/account/profile?next=${encodeURIComponent(safe)}` : '/account/profile';
}
