'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { authPath, safeReturnPath, signInHref, type AuthScreen } from './return-path';

export function useCurrentPath(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function useSignInHref(): string {
  return signInHref(useCurrentPath());
}

export function useReturnPath(): string {
  const searchParams = useSearchParams();
  return safeReturnPath(searchParams.get('next')) ?? '';
}

export function useAuthHref(path: AuthScreen, extra?: Record<string, string>): string {
  const searchParams = useSearchParams();
  return authPath(path, searchParams.get('next'), extra);
}
