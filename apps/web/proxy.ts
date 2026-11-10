import { NextResponse, type NextRequest } from 'next/server';
import { isPublicPath, localeFromLangParam } from './src/seo/urls.ts';

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete('x-tn-locale');
  if (isPublicPath(request.nextUrl.pathname)) {
    headers.set('x-tn-locale', localeFromLangParam(request.nextUrl.searchParams.get('lang')));
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|ico|svg|txt|xml|webmanifest)$).*)'],
};
