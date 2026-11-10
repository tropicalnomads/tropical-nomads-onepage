'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { isPublicPath, searchLinks } from './urls';

export function PublicSearchLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (!isPublicPath(pathname)) {
    return null;
  }
  const links = searchLinks(pathname, searchParams.get('lang'));
  return (
    <>
      <link rel="canonical" href={links.canonical} />
      <link rel="alternate" hrefLang="en" href={links.english} />
      <link rel="alternate" hrefLang="pt" href={links.portuguese} />
      <link rel="alternate" hrefLang="x-default" href={links.english} />
      <meta property="og:url" content={links.canonical} />
    </>
  );
}
