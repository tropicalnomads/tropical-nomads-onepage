import { cookies } from 'next/headers';
import { chooseReturnPath, safeReturnPath } from './return-path';

export const returnCookieName = 'tn:return';

const returnCookieMaxAge = 60 * 30;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export async function rememberReturnPath(value: string | null | undefined): Promise<void> {
  const safe = safeReturnPath(value);
  if (!safe) {
    return;
  }
  const jar = await cookies();
  jar.set(returnCookieName, encodeURIComponent(safe), cookieOptions(returnCookieMaxAge));
}

export async function readReturnPath(): Promise<string | undefined> {
  const jar = await cookies();
  const raw = jar.get(returnCookieName)?.value;
  if (!raw) {
    return undefined;
  }
  try {
    return safeReturnPath(decodeURIComponent(raw));
  } catch {
    return undefined;
  }
}

export async function clearReturnPath(): Promise<void> {
  const jar = await cookies();
  jar.set(returnCookieName, '', cookieOptions(0));
}

export async function takeReturnPath(preferred?: string | null): Promise<string> {
  const destination = chooseReturnPath(preferred, await readReturnPath());
  await clearReturnPath();
  return destination;
}
